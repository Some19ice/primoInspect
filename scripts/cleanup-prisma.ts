/**
 * T063-T065 - Remove Prisma Client, Schema, and Database Configuration
 * Complete cleanup of Prisma-related files and dependencies
 */

import fs from 'fs/promises'
import path from 'path'
import { execSync } from 'child_process'

interface CleanupResult {
  success: boolean
  removedFiles: string[]
  removedDependencies: string[]
  errors: string[]
}

export async function cleanupPrisma(): Promise<CleanupResult> {
  const result: CleanupResult = {
    success: true,
    removedFiles: [],
    removedDependencies: [],
    errors: []
  }

  try {
    // T064 - Delete Prisma schema and migration files
    const filesToRemove = [
      'prisma/schema.prisma',
      'prisma/migrations',
      'prisma/seed.ts',
      'prisma/seed.js',
      'prisma'
    ]

    for (const filePath of filesToRemove) {
      try {
        const fullPath = path.join(process.cwd(), filePath)
        const stats = await fs.stat(fullPath)
        
        if (stats.isDirectory()) {
          await fs.rm(fullPath, { recursive: true, force: true })
        } else {
          await fs.unlink(fullPath)
        }
        
        result.removedFiles.push(filePath)
        console.log(`✅ Removed ${filePath}`)
      } catch (error) {
        // File might not exist, which is fine
        if ((error as any).code !== 'ENOENT') {
          result.errors.push(`Failed to remove ${filePath}: ${error}`)
        }
      }
    }

    // T063 - Remove Prisma client and dependencies
    try {
      const packageJsonPath = path.join(process.cwd(), 'package.json')
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'))
      
      const prismaPackages = [
        'prisma',
        '@prisma/client',
        'prisma-client-js'
      ]
      
      let packagesRemoved = false
      
      // Remove from dependencies
      if (packageJson.dependencies) {
        prismaPackages.forEach(pkg => {
          if (packageJson.dependencies[pkg]) {
            delete packageJson.dependencies[pkg]
            result.removedDependencies.push(pkg)
            packagesRemoved = true
          }
        })
      }
      
      // Remove from devDependencies
      if (packageJson.devDependencies) {
        prismaPackages.forEach(pkg => {
          if (packageJson.devDependencies[pkg]) {
            delete packageJson.devDependencies[pkg]
            result.removedDependencies.push(pkg)
            packagesRemoved = true
          }
        })
      }
      
      if (packagesRemoved) {
        await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2))
        console.log('✅ Removed Prisma packages from package.json')
      }
      
    } catch (error) {
      result.errors.push(`Failed to update package.json: ${error}`)
    }

    // T065 - Clean up old database connection configuration
    try {
      // Remove any Prisma-related imports from existing files
      const filesToCheck = [
        'lib/db.ts',
        'lib/database.ts',
        'lib/prisma.ts'
      ]
      
      for (const filePath of filesToCheck) {
        try {
          const fullPath = path.join(process.cwd(), filePath)
          await fs.unlink(fullPath)
          result.removedFiles.push(filePath)
          console.log(`✅ Removed ${filePath}`)
        } catch (error) {
          // File might not exist, which is fine
          if ((error as any).code !== 'ENOENT') {
            result.errors.push(`Failed to remove ${filePath}: ${error}`)
          }
        }
      }
      
    } catch (error) {
      result.errors.push(`Failed to clean up database config: ${error}`)
    }

    // Remove node_modules/.prisma directory
    try {
      const prismaNodeModulesPath = path.join(process.cwd(), 'node_modules', '.prisma')
      await fs.rm(prismaNodeModulesPath, { recursive: true, force: true })
      result.removedFiles.push('node_modules/.prisma')
      console.log('✅ Removed node_modules/.prisma')
    } catch (error) {
      // Directory might not exist, which is fine
      if ((error as any).code !== 'ENOENT') {
        result.errors.push(`Failed to remove node_modules/.prisma: ${error}`)
      }
    }

    // Create cleanup summary
    const summary = {
      cleanupDate: new Date().toISOString(),
      removedFiles: result.removedFiles,
      removedDependencies: result.removedDependencies,
      errors: result.errors,
      success: result.success
    }

    await fs.writeFile(
      path.join(process.cwd(), 'prisma-cleanup-summary.json'),
      JSON.stringify(summary, null, 2)
    )

    if (result.errors.length > 0) {
      result.success = false
    }

  } catch (error) {
    result.success = false
    result.errors.push(`Cleanup failed: ${error}`)
  }

  return result
}

export async function reinstallDependencies(): Promise<boolean> {
  try {
    console.log('🔄 Reinstalling dependencies without Prisma...')
    execSync('npm install', { stdio: 'inherit' })
    console.log('✅ Dependencies reinstalled successfully')
    return true
  } catch (error) {
    console.error('❌ Failed to reinstall dependencies:', error)
    return false
  }
}

// Run cleanup if called directly
if (require.main === module) {
  async function runCleanup() {
    console.log('🧹 Starting Prisma cleanup...\n')
    
    const cleanupResult = await cleanupPrisma()
    
    console.log('\n📊 Cleanup Summary:')
    console.log(`Success: ${cleanupResult.success}`)
    console.log(`Removed files: ${cleanupResult.removedFiles.join(', ')}`)
    console.log(`Removed dependencies: ${cleanupResult.removedDependencies.join(', ')}`)
    
    if (cleanupResult.errors.length > 0) {
      console.log('\n❌ Cleanup Errors:')
      cleanupResult.errors.forEach(error => console.log(`  - ${error}`))
    }

    if (cleanupResult.success && cleanupResult.removedDependencies.length > 0) {
      console.log('\n🔄 Reinstalling dependencies...')
      const reinstallSuccess = await reinstallDependencies()
      
      if (reinstallSuccess) {
        console.log('\n🎉 Prisma cleanup completed successfully!')
        console.log('Your project now uses Supabase exclusively.')
      } else {
        console.log('\n⚠️  Cleanup completed but dependency reinstall failed.')
        console.log('Please run "npm install" manually.')
      }
    }
  }

  runCleanup().catch(console.error)
}
