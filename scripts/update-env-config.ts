/**
 * T062 - Update Environment Configuration to Use Supabase Exclusively
 * Removes Prisma configuration and ensures Supabase-only setup
 */

import fs from 'fs/promises'
import path from 'path'

interface ConfigUpdateResult {
  success: boolean
  updatedFiles: string[]
  removedConfigs: string[]
  errors: string[]
}

export async function updateEnvironmentConfig(): Promise<ConfigUpdateResult> {
  const result: ConfigUpdateResult = {
    success: true,
    updatedFiles: [],
    removedConfigs: [],
    errors: []
  }

  try {
    // Update .env.example to remove Prisma configs
    try {
      const envExamplePath = path.join(process.cwd(), '.env.example')
      let envExample = await fs.readFile(envExamplePath, 'utf-8')
      
      // Remove Prisma-related environment variables
      const prismaConfigs = [
        'DATABASE_URL',
        'PRISMA_DATABASE_URL',
        'DIRECT_URL'
      ]
      
      prismaConfigs.forEach(config => {
        const regex = new RegExp(`^${config}=.*$`, 'gm')
        if (envExample.match(regex)) {
          envExample = envExample.replace(regex, '')
          result.removedConfigs.push(config)
        }
      })
      
      // Clean up empty lines
      envExample = envExample.replace(/\n\n+/g, '\n\n')
      
      await fs.writeFile(envExamplePath, envExample)
      result.updatedFiles.push('.env.example')
      console.log('✅ Updated .env.example - removed Prisma configs')
    } catch (error) {
      result.errors.push(`Failed to update .env.example: ${error}`)
    }

    // Update package.json to remove Prisma scripts
    try {
      const packageJsonPath = path.join(process.cwd(), 'package.json')
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'))
      
      // Remove Prisma-related scripts
      const prismaScripts = [
        'db:generate',
        'db:push',
        'db:migrate',
        'db:studio',
        'db:seed'
      ]
      
      if (packageJson.scripts) {
        prismaScripts.forEach(script => {
          if (packageJson.scripts[script]) {
            delete packageJson.scripts[script]
            result.removedConfigs.push(`script:${script}`)
          }
        })
      }
      
      await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2))
      result.updatedFiles.push('package.json')
      console.log('✅ Updated package.json - removed Prisma scripts')
    } catch (error) {
      result.errors.push(`Failed to update package.json: ${error}`)
    }

    // Create Supabase-only environment template
    try {
      const supabaseEnvTemplate = `# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret

# Application Configuration
NODE_ENV=development
`
      
      await fs.writeFile(
        path.join(process.cwd(), '.env.supabase-template'),
        supabaseEnvTemplate
      )
      result.updatedFiles.push('.env.supabase-template')
      console.log('✅ Created Supabase-only environment template')
    } catch (error) {
      result.errors.push(`Failed to create Supabase template: ${error}`)
    }

    if (result.errors.length > 0) {
      result.success = false
    }

  } catch (error) {
    result.success = false
    result.errors.push(`Configuration update failed: ${error}`)
  }

  return result
}

// Run configuration update if called directly
if (require.main === module) {
  updateEnvironmentConfig()
    .then((result) => {
      console.log('\n⚙️  Configuration Update Summary:')
      console.log(`Success: ${result.success}`)
      console.log(`Updated files: ${result.updatedFiles.join(', ')}`)
      console.log(`Removed configs: ${result.removedConfigs.join(', ')}`)
      
      if (result.errors.length > 0) {
        console.log('\n❌ Errors:')
        result.errors.forEach(error => console.log(`  - ${error}`))
      }
    })
    .catch(console.error)
}
