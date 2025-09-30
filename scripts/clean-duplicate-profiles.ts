#!/usr/bin/env tsx
/**
 * Clean Duplicate Profiles
 * 
 * This script removes duplicate profiles that may have been created
 * during seeding attempts, keeping only the most recent one for each user.
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { Database } from '../lib/supabase/types'

// Load environment variables
config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.replace(/"/g, '') // Remove quotes

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables')
  process.exit(1)
}

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function cleanDuplicateProfiles() {
  console.log('🧹 Cleaning duplicate profiles...')
  
  try {
    // Get all profiles
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('❌ Error fetching profiles:', error.message)
      return false
    }
    
    if (!profiles || profiles.length === 0) {
      console.log('✅ No profiles found')
      return true
    }
    
    console.log(`📊 Found ${profiles.length} total profiles`)
    
    // Group profiles by user ID
    const profilesByUserId = new Map<string, typeof profiles>()
    
    for (const profile of profiles) {
      if (!profilesByUserId.has(profile.id)) {
        profilesByUserId.set(profile.id, [])
      }
      profilesByUserId.get(profile.id)!.push(profile)
    }
    
    console.log(`👥 Found ${profilesByUserId.size} unique users`)
    
    let duplicatesRemoved = 0
    
    // Check each user for duplicates
    for (const [userId, userProfiles] of profilesByUserId) {
      if (userProfiles.length > 1) {
        console.log(`⚠️  User ${userId} has ${userProfiles.length} profiles`)
        
        // Keep the most recent profile (first in our sorted list)
        const keepProfile = userProfiles[0]
        const duplicateProfiles = userProfiles.slice(1)
        
        console.log(`   Keeping profile: ${keepProfile.name} (${keepProfile.email})`)
        
        // Delete duplicate profiles
        for (const duplicate of duplicateProfiles) {
          console.log(`   Removing duplicate: ${duplicate.name} (${duplicate.email})`)
          
          const { error: deleteError } = await supabase
            .from('profiles')
            .delete()
            .eq('id', duplicate.id)
            .eq('created_at', duplicate.created_at) // Extra safety
          
          if (deleteError) {
            console.warn(`⚠️  Warning deleting duplicate profile:`, deleteError.message)
          } else {
            duplicatesRemoved++
          }
        }
      }
    }
    
    console.log(`✅ Removed ${duplicatesRemoved} duplicate profiles`)
    return true
    
  } catch (error) {
    console.error('❌ Error cleaning profiles:', error)
    return false
  }
}

async function main() {
  console.log('🧹 PrimoInspect Profile Cleanup')
  console.log('==============================')
  console.log()
  
  const success = await cleanDuplicateProfiles()
  
  if (success) {
    console.log()
    console.log('🎉 Profile cleanup completed successfully!')
    console.log('   Run: npm run test:auth')
  } else {
    console.log('❌ Profile cleanup failed')
    process.exit(1)
  }
}

main().catch((error) => {
  console.error('❌ Cleanup script failed:', error)
  process.exit(1)
})