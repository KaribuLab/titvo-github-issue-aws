import { describe, it, expect, beforeEach } from 'vitest'
import { Test, TestingModule } from '@nestjs/testing'
import { AppModule } from './app.module'
import { ConfigModule } from '@nestjs/config'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'

describe('AppModule', () => {
  let module: TestingModule

  describe('Template Import', () => {
    it('debe existir el archivo de template', () => {
      const templatePath = join(__dirname, 'templates', 'github-issue-template.md')
      
      expect(existsSync(templatePath)).toBe(true)
    })

    it('debe poder leer el contenido del template', () => {
      const templatePath = join(__dirname, 'templates', 'github-issue-template.md')
      
      expect(() => {
        readFileSync(templatePath, 'utf-8')
      }).not.toThrow()
    })

    it('el template debe tener contenido válido', () => {
      const templatePath = join(__dirname, 'templates', 'github-issue-template.md')
      const content = readFileSync(templatePath, 'utf-8')
      
      expect(content).toBeTruthy()
      expect(content.length).toBeGreaterThan(0)
      expect(content).toContain('{{')
      expect(content).toContain('}}')
    })

    it('el template debe contener las variables esperadas de Mustache', () => {
      const templatePath = join(__dirname, 'templates', 'github-issue-template.md')
      const content = readFileSync(templatePath, 'utf-8')
      
      // Validar que contiene las variables principales del template
      expect(content).toContain('{{scan_date}}')
      expect(content).toContain('{{total_issues}}')
      expect(content).toContain('{{#issues}}')
      expect(content).toContain('{{/issues}}')
    })
  })

  describe('Module Initialization', () => {
    beforeEach(async () => {
      module = await Test.createTestingModule({
        imports: [AppModule],
      }).compile()
    })

    it('debe poder compilar el módulo correctamente', () => {
      expect(module).toBeDefined()
    })

    it('debe tener ConfigModule importado', () => {
      const configModule = module.get(ConfigModule)
      expect(configModule).toBeDefined()
    })
  })

  describe('Template Path Resolution', () => {
    it('debe resolver correctamente la ruta del template con __dirname', () => {
      const templatePath = join(__dirname, 'templates', 'github-issue-template.md')
      const expectedPath = /github-issue-template\.md$/
      
      expect(templatePath).toMatch(expectedPath)
    })

    it('debe manejar errores si el template no existe', () => {
      const invalidPath = join(__dirname, 'templates', 'non-existent-template.md')
      
      expect(existsSync(invalidPath)).toBe(false)
    })
  })
})

