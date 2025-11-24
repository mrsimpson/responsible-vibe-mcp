# Development Plan: responsible-vibe-mcp (vscode_skript branch)

*Generated on 2025-11-24 by Vibe Feature MCP*
*Workflow: [minor](https://mrsimpson.github.io/responsible-vibe-mcp/workflows/minor)*

## Goal
Neuer VS Code Config Generator für das `--generate-config vscode` Kommando erstellen.

## Explore
### Tasks
*Alle Tasks abgeschlossen*

### Completed
- [x] Created development plan file
- [x] Analysiere bestehende Config-Generatoren (Amazon Q, Claude, Gemini, OpenCode)
- [x] Bestimme VS Code Konfigurationsformat und benötigte Dateien
- [x] Entwerfe VS Code Generator-Implementierung

## Implement

### Phase Entrance Criteria:
- [x] VS Code Konfigurationsformat ist klar definiert
- [x] Benötigte Dateien und deren Struktur sind dokumentiert
- [x] Generator-Design ist im Plan-File dokumentiert

### Tasks
*Alle Tasks abgeschlossen*

### Completed
- [x] Implementiere VSCodeConfigGenerator Klasse in config-generator.ts
- [x] Registriere VSCodeConfigGenerator in ConfigGeneratorFactory
- [x] Aktualisiere Dokumentation (README.md, agent-setup.md)
- [x] Fixe async/await für parseCliArgs und runCli
- [x] Teste Config-Generierung mit `--generate-config vscode`
- [x] Verifiziere generierte Dateien (.vscode/mcp.json und .github/copilot-instructions.md)

## Finalize

### Phase Entrance Criteria:
- [x] VS Code Config Generator ist implementiert
- [x] Generator ist in Factory registriert
- [x] Funktionalität ist getestet

### Tasks
*Alle Tasks abgeschlossen*

### Completed
- [x] Code Cleanup: Debug-Output geprüft (alle console.log sind legitime CLI-Outputs)
- [x] Dokumentation finalisiert (README.md, packages/docs/README.md, agent-setup.md)
- [x] Test-Verzeichnis aufgeräumt (test-vscode-config und test-generation.sh entfernt)
- [x] Tests laufen erfolgreich

## Key Decisions

### VS Code + GitHub Copilot Konfiguration
- **Unterschied zu Claude**: VS Code nutzt `.vscode/mcp.json` statt root `.mcp.json`
- **System Prompt**: GitHub Copilot nutzt `.github/copilot-instructions.md` statt separate CLAUDE.md
- **Zwei Dateien generieren**:
  1. `.vscode/mcp.json` - MCP Server Konfiguration
  2. `.github/copilot-instructions.md` - System Instructions für Copilot
- **Tool-Referenzierung**: In Instructions mit `#responsible-vibe-mcp_tool_name` Syntax
- **Windows-Kompatibilität**: Wie andere Generatoren - cmd/npx basierend auf Plattform

### Bestehende Generator-Architektur
- Factory Pattern mit ConfigGenerator Basisklasse
- Jeder Generator erbt von ConfigGenerator
- Shared utilities: getSystemPrompt(), writeFile(), getDefaultMcpConfig()
- Factory registriert Generatoren im switch statement

### VS Code Generator Design
```typescript
class VSCodeConfigGenerator extends ConfigGenerator {
  async generate(outputDir: string): Promise<void> {
    // 1. Generate .vscode/mcp.json with server config
    // 2. Generate .github/copilot-instructions.md with system prompt + tool guidance
  }
}
```

## Notes

### VS Code MCP Konfigurationsformat
```json
{
  "servers": {
    "responsible-vibe-mcp": {
      "command": "npx",
      "args": ["@codemcp/workflows@latest"]
    }
  }
}
```

### Copilot Instructions Format
- Markdown-Format
- Beschreibt verfügbare MCP Tools
- Gibt Anweisungen für Workflow-Nutzung
- Tool-Referenzen: `#responsible-vibe-mcp_whats_next`, etc.

---
*This plan is maintained by the LLM. Tool responses provide guidance on which section to focus on and what tasks to work on.*
