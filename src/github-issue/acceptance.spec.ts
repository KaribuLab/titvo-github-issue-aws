import { it, expect, vi } from 'vitest'
import { readFileSync } from 'fs'
import { GithubIssueService } from './github-issue.service'
const { request } = vi.hoisted(() => ({ request: vi.fn() }))
vi.mock('octokit', () => ({ Octokit: class { request = request } }))
it.each([false, true])('renders accepted findings (mixed=%s)', async mixed => {
  request.mockResolvedValue({ status: 201, data: { id: 1, html_url: 'url' } })
  const service = new GithubIssueService({ getDecryptedParameterValue: async () => 'token' } as any, readFileSync('src/templates/github-issue-template.md', 'utf8'))
  const finding = { title: 'MD5', description: 'Legacy hashing', severity: 'LOW', path: 'src/a', line: 1, code: 'md5()', summary: 'Evidence', recommendation: 'Replace' }
  await service.process({ annotations: [{ ...finding, acceptance: { reason: '<script>legacy</script>', accepted_by: '<Security>', expires_on: '2030-01-01' } }, ...(mixed ? [finding] : [])] } as any)
  const body = request.mock.calls.at(-1)![1].body
  expect(body).toContain('Accepted risks: 1')
  expect(body).toContain(`Active findings: ${mixed ? 1 : 0}`)
  for (const text of ['MD5', 'Legacy hashing', 'md5()', 'Evidence', 'Replace', 'Bajo', '&lt;script&gt;legacy&lt;&#x2F;script&gt;', '&lt;Security&gt;', '2030-01-01']) expect(body).toContain(text)
  expect(body).not.toContain('<script>legacy</script>')
})
it('preserves rendering without acceptance', async () => {
  request.mockResolvedValue({ status: 201, data: { id: 1, html_url: 'url' } })
  const service = new GithubIssueService({ getDecryptedParameterValue: async () => 'token' } as any, readFileSync('src/templates/github-issue-template.md', 'utf8'))
  await service.process({ annotations: [{ title: 'Original', severity: 'HIGH', description: 'Evidence', path: 'src/a', line: 3 }] } as any)
  const body = request.mock.calls.at(-1)![1].body
  expect(body).toContain('Original')
  expect(body).toContain('**Problemas Altos**: 1')
  expect(body).not.toContain('Accepted risk')
  expect(body).not.toContain('Active findings')
})
