# Reporte de Análisis de Seguridad Titvo

**Fecha de Análisis**: {{scan_date}}  
**Repositorio**: {{repo_owner}}/{{repo_name}}  
**Commit**: [`{{commit_hash}}`]({{commit_url}})

## Resumen

{{#has_acceptance}}
- Active findings: {{active_issues}}
- Accepted risks: {{accepted_issues}}
{{/has_acceptance}}
- **Total de Problemas**: {{total_issues}}
- **Problemas Críticos**: {{critical_issues}}
- **Problemas Altos**: {{high_issues}}
- **Problemas Medios**: {{medium_issues}}
- **Problemas Bajos**: {{low_issues}}

## Problemas Detectados

{{#issues}}

### {{{title}}}

{{#acceptance}}
**Accepted risk**
- Reason: {{reason}}
- Declared responsible party (not authenticated): {{accepted_by}}
- Expires on: {{expires_on}}
{{/acceptance}}
`{{{severity_label}}}`

- **Archivo**: {{{path}}}
- **Línea**: {{line}}
- **Código**:

```
{{{code}}}
```

### Descripción

{{{description}}}

> **Recomandación**
> {{{recommendation}}}

{{#summary}}

### Resumen

{{{summary}}}

{{/summary}}

{{/issues}}
