export enum ReportStatus {
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  WARNING = 'WARNING',
}

export class Annotation {
  acceptance?: { reason: string; accepted_by: string; expires_on: string }
  title: string
  description: string
  severity: string
  path: string
  line: number
  summary: string
  recommendation: string
}

export class GithubIssueInputDto {
  repoOwner: string
  repoName: string
  asignee: string
  commitHash: string
  status: ReportStatus
  annotations: Annotation[]
}
export class GithubIssueOutputDto {
  issueId: number
  htmlURL: string
}