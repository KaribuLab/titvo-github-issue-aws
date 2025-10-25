import { Module } from '@nestjs/common'
import configuration from '@lambda/configuration';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino'
import * as pino from 'pino'
import { GithubIssueModule } from '@lambda/github-issue/github-issue.module'
import { join } from 'path';
import { readFileSync } from 'fs';

const githubIssueTemplatePath = join(__dirname, 'templates', 'github-issue-template.md')
const githubIssueTemplate = readFileSync(githubIssueTemplatePath, 'utf-8')

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? 'info',
        timestamp: pino.stdTimeFunctions.isoTime,
        formatters: {
          level (label: string): { level: string } {
            return { level: label }
          }
        }
      }
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    GithubIssueModule.forRoot({
      useFactory: (): string => githubIssueTemplate,
    }),
  ]
})
export class AppModule {}
