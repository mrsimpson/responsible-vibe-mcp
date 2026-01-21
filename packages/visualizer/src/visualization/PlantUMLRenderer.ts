import { YamlStateMachine, YamlState } from '../types/ui-types';
import {
  encodePlantUML,
  encodePlantUMLFallback,
} from '../utils/PlantUMLEncoder';

export class PlantUMLRenderer {
  private container: HTMLElement;
  private onElementClick?: (
    elementType: 'state' | 'transition' | 'clear-selection',
    elementId: string,
    data?: unknown
  ) => void;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  /**
   * Set click handler for interactive elements
   */
  public setClickHandler(
    handler: (
      elementType: 'state' | 'transition' | 'clear-selection',
      elementId: string,
      data?: unknown
    ) => void
  ): void {
    this.onElementClick = handler;
  }

  /**
  /**
   * Render workflow using PlantUML with auto-layout
   */
  public async renderWorkflow(workflow: YamlStateMachine): Promise<void> {
    this.container.innerHTML = '';
    this.container.style.overflow = 'auto';
    this.container.style.height = '100%';

    const plantUMLCode = this.generatePlantUMLStateMachine(workflow);
    const diagramUrl = await this.createPlantUMLUrl(plantUMLCode);

    // Create container with diagram and interactive overlay
    const diagramContainer = document.createElement('div');
    diagramContainer.style.position = 'relative';
    diagramContainer.style.padding = '20px';
    diagramContainer.style.textAlign = 'center';

    // Add title
    const title = document.createElement('div');
    title.innerHTML = `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        margin-bottom: 10px;
        flex-wrap: wrap;
      ">
        <h2 style="
          color: #1e293b;
          margin: 0;
          font-size: 1.5rem;
          cursor: pointer;
          padding: 8px 12px;
          border-radius: 6px;
          transition: background-color 0.2s ease;
        "
        class="workflow-title-clickable"
        title="Click to show workflow information"
        >${workflow.name} Workflow ${workflow.metadata?.domain ? `<span class="domain-pill" data-domain="${workflow.metadata.domain}">${workflow.metadata.domain}</span>` : ''}</h2>
      </div>
      <p style="color: #64748b; margin-bottom: 20px; text-align: center;">${workflow.description || ''}</p>
    `;

    // Add click handler for workflow title
    const titleElement = title.querySelector(
      '.workflow-title-clickable'
    ) as HTMLElement;
    if (titleElement) {
      titleElement.addEventListener('click', () => {
        if (this.onElementClick) {
          this.onElementClick('clear-selection', '', null);
        }
      });

      // Add hover effects
      titleElement.addEventListener('mouseenter', () => {
        titleElement.style.backgroundColor = '#f8fafc';
      });

      titleElement.addEventListener('mouseleave', () => {
        titleElement.style.backgroundColor = 'transparent';
      });
    }

    diagramContainer.appendChild(title);

    // Add PlantUML diagram with SVG proxy for interactivity
    const diagramWrapper = document.createElement('div');
    diagramWrapper.style.position = 'relative';
    diagramWrapper.style.display = 'inline-block';

    // Instead of img, fetch the SVG directly and embed it
    this.loadInteractiveSVG(diagramUrl, diagramWrapper, workflow);

    diagramContainer.appendChild(diagramWrapper);

    this.container.appendChild(diagramContainer);
  }

  /**
   * Generate PlantUML state machine code with proper syntax and auto-layout
   */
  private generatePlantUMLStateMachine(workflow: YamlStateMachine): string {
    const lines: string[] = [];

    lines.push('@startuml');
    lines.push('!theme plain');
    lines.push('skinparam backgroundColor white');
    lines.push('skinparam state {');
    lines.push('  BackgroundColor white');
    lines.push('  BorderColor #2563eb');
    lines.push('  FontColor #1e293b');
    lines.push('  FontSize 12');
    lines.push('}');
    lines.push('skinparam arrow {');
    lines.push('  Color #94a3b8');
    lines.push('  FontColor #64748b');
    lines.push('  FontSize 10');
    lines.push('}');
    lines.push('');

    // Add initial state
    lines.push(`[*] --> ${workflow.initial_state}`);
    lines.push('');

    // Add states with descriptions
    for (const [stateName, stateConfig] of Object.entries(workflow.states) as [
      string,
      YamlState,
    ][]) {
      if (stateConfig.description) {
        lines.push(`${stateName} : ${stateConfig.description}`);
      }
    }
    lines.push('');

    // Add transitions
    for (const [stateName, stateConfig] of Object.entries(workflow.states) as [
      string,
      YamlState,
    ][]) {
      if (stateConfig.transitions) {
        for (const transition of stateConfig.transitions) {
          const label = transition.trigger.replace(/_/g, ' ');

          // Check for review perspectives and add review icon
          const hasReviews =
            transition.review_perspectives &&
            transition.review_perspectives.length > 0;
          // Add review indicator
          let reviewIcon = '';
          if (hasReviews) {
            reviewIcon = ' 🛡️';
          }

          const finalLabel = `${label}${reviewIcon}`;
          lines.push(`${stateName} --> ${transition.to} : ${finalLabel}`);
        }
      }
    }

    // Add final states if any
    const finalStates = Object.keys(workflow.states).filter(state => {
      const stateConfig = workflow.states[state];
      return (
        stateConfig &&
        (!stateConfig.transitions || stateConfig.transitions.length === 0)
      );
    });
    if (finalStates.length > 0) {
      lines.push('');
      for (const state of finalStates) {
        lines.push(`${state} --> [*]`);
      }
    }

    lines.push('');
    lines.push('@enduml');

    return lines.join('\n');
  }

  /**
   * Create PlantUML web service URL with proper encoding
   */
  private async createPlantUMLUrl(plantUMLCode: string): Promise<string> {
    try {
      // Try DEFLATE encoding first (proper PlantUML format)
      const encoded = await encodePlantUML(plantUMLCode);
      return `https://www.plantuml.com/plantuml/svg/${encoded}`;
    } catch (error) {
      console.warn('DEFLATE encoding failed, trying fallback:', error);
      try {
        // Fallback to base64 with ~1 header
        const encoded = await encodePlantUMLFallback(plantUMLCode);
        return `https://www.plantuml.com/plantuml/svg/${encoded}`;
      } catch (fallbackError) {
        console.error('All PlantUML encoding methods failed:', fallbackError);
        // Final fallback to simple URL encoding
        const encoded = encodeURIComponent(plantUMLCode);
        return `https://www.plantuml.com/plantuml/svg/~1${encoded}`;
      }
    }
  }

  /**
   * Load SVG directly and make it interactive
   */
  private async loadInteractiveSVG(
    svgUrl: string,
    container: HTMLElement,
    workflow: YamlStateMachine
  ): Promise<void> {
    try {
      const response = await fetch(svgUrl);

      if (!response.ok) {
        throw new Error(`Failed to fetch SVG: ${response.status}`);
      }

      const svgText = await response.text();

      // Create a div to hold the SVG
      const svgContainer = document.createElement('div');
      svgContainer.innerHTML = svgText;
      svgContainer.style.border = '1px solid #e2e8f0';
      svgContainer.style.borderRadius = '8px';
      svgContainer.style.backgroundColor = 'white';
      svgContainer.style.overflow = 'hidden';

      const svgElement = svgContainer.querySelector('svg');
      if (svgElement) {
        // Make SVG responsive
        svgElement.style.maxWidth = '100%';
        svgElement.style.height = 'auto';
        svgElement.style.display = 'block';

        // Add interactivity to SVG elements
        this.makeSVGInteractive(svgElement, workflow);
      }

      container.appendChild(svgContainer);
    } catch (error) {
      console.error('Failed to load interactive SVG:', error);
      this.showError('Failed to load interactive diagram. Using fallback.');
      this.renderFallbackDiagram();
    }
  }

  /**
   * Make SVG elements interactive by adding click handlers
   */
  private makeSVGInteractive(
    svgElement: SVGSVGElement,
    workflow: YamlStateMachine
  ): void {
    /**
     * STATE DETECTION STRATEGY:
     *
     * PlantUML generates SVG where state elements don't have meaningful IDs that match
     * state names. Instead, states appear as <g> elements with empty/random IDs, but
     * they contain <text> elements with the actual state names.
     *
     * Strategy:
     * 1. Find all <text> elements in the SVG
     * 2. Check if text content matches any workflow state name
     * 3. Navigate up to find the parent <g> element
     * 4. Attach click handlers to the parent <g>
     *
     * This approach works because PlantUML consistently puts state names
     * in <text> elements, even though the container IDs are not predictable.
     */
    const states = Object.keys(workflow.states);

    // Find all text elements and check if their content matches a state name
    const textElements = svgElement.querySelectorAll('text');
    for (const textElement of textElements) {
      const textContent = textElement.textContent?.trim();
      if (textContent && states.includes(textContent)) {
        // Found a text element with a state name, get its parent group
        const group = textElement.closest('g');
        if (group) {
          const stateName = textContent;

          // Make the entire group clickable
          (group as unknown as HTMLElement).style.cursor = 'pointer';
          (group as unknown as HTMLElement).style.transition = 'all 0.2s ease';

          // Find the rect/shape element for hover effects
          const shape = group.querySelector('rect, ellipse, polygon');
          const originalFill = shape?.getAttribute('fill') || '#ffffff';
          const originalStroke = shape?.getAttribute('stroke') || '#000000';

          // Add hover effects
          group.addEventListener('mouseenter', () => {
            if (shape) {
              shape.setAttribute('fill', '#e0f2fe');
              shape.setAttribute('stroke', '#2563eb');
              shape.setAttribute('stroke-width', '2');
            }
          });

          group.addEventListener('mouseleave', () => {
            if (shape) {
              shape.setAttribute('fill', originalFill);
              shape.setAttribute('stroke', originalStroke);
              shape.setAttribute('stroke-width', '1');
            }
          });

          // Add click handler
          group.addEventListener('click', e => {
            e.stopPropagation();
            if (this.onElementClick) {
              this.onElementClick(
                'state',
                stateName,
                workflow.states[stateName]
              );
            }
          });
        }
      }
    }

    /**
     * TRANSITION DETECTION STRATEGY:
     *
     * PlantUML generates transition elements as <g class="link"> with IDs like "lnk3",
     * "lnk4", etc. These IDs don't contain source/target state information.
     *
     * The original code expected IDs like "link_reproduce_analyze" but PlantUML
     * generates generic IDs like "lnk3". We can't rely on ID parsing.
     *
     * Strategy:
     * 1. Find all <g class="link"> elements with IDs starting with "lnk"
     * 2. Extract the transition label text from the <text> element inside
     * 3. Use fuzzy text matching to find corresponding transition in workflow data
     * 4. Match transition trigger text against the SVG label text
     * 5. Attach click handlers with full transition data
     *
     * This approach works because:
     * - PlantUML consistently puts transition labels in <text> elements
     * - We can normalize text (underscores to spaces) for matching
     * - We have access to complete workflow transition data for context
     */
    const linkGroups = svgElement.querySelectorAll('g.link[id^="lnk"]');
    for (const linkGroup of linkGroups) {
      const linkId = linkGroup.getAttribute('id');
      if (linkId && linkId.startsWith('lnk')) {
        // Make the entire link group clickable
        (linkGroup as unknown as HTMLElement).style.cursor = 'pointer';
        (linkGroup as unknown as HTMLElement).style.transition =
          'all 0.2s ease';

        // Find path and text elements for hover effects
        const pathEl = linkGroup.querySelector('path');
        const textEl = linkGroup.querySelector('text');
        const originalStroke = pathEl?.getAttribute('stroke') || '#94A3B8';
        const originalTextFill = textEl?.getAttribute('fill') || '#64748B';

        // Add hover effects
        linkGroup.addEventListener('mouseenter', () => {
          if (pathEl) {
            pathEl.setAttribute('stroke', '#2563eb');
            pathEl.setAttribute('stroke-width', '3');
          }
          if (textEl) {
            textEl.setAttribute('fill', '#2563eb');
            (textEl as unknown as HTMLElement).style.fontWeight = 'bold';
          }
        });

        linkGroup.addEventListener('mouseleave', () => {
          if (pathEl) {
            pathEl.setAttribute('stroke', originalStroke);
            pathEl.setAttribute('stroke-width', '1');
          }
          if (textEl) {
            textEl.setAttribute('fill', originalTextFill);
            (textEl as unknown as HTMLElement).style.fontWeight = 'normal';
          }
        });

        // Add click handler - find transition by label text matching
        linkGroup.addEventListener('click', e => {
          e.stopPropagation();

          // Try to find matching transition by analyzing the label text
          const labelText = textEl?.textContent?.trim();
          if (labelText) {
            // Clean the label text (remove emoji/icons, normalize spaces)
            const cleanLabel = labelText.replace(/[^\w\s]/g, '').trim();

            // Search through all states to find matching transition
            for (const [stateName, stateData] of Object.entries(
              workflow.states
            )) {
              if (stateData.transitions) {
                for (const transition of stateData.transitions) {
                  // Normalize trigger text: "bug_reproduced" -> "bug reproduced"
                  const cleanTrigger = transition.trigger.replace(/_/g, ' ');

                  // Fuzzy match: check if labels contain each other (case-insensitive)
                  if (
                    cleanTrigger
                      .toLowerCase()
                      .includes(cleanLabel.toLowerCase()) ||
                    cleanLabel
                      .toLowerCase()
                      .includes(cleanTrigger.toLowerCase())
                  ) {
                    // Found matching transition - attach complete data
                    if (this.onElementClick) {
                      this.onElementClick(
                        'transition',
                        `${stateName}->${transition.to}`,
                        {
                          from: stateName,
                          to: transition.to,
                          trigger: transition.trigger,
                          instructions: transition.instructions,
                          additional_instructions:
                            transition.additional_instructions,
                          transition_reason: transition.transition_reason,
                          review_perspectives:
                            transition.review_perspectives || [],
                        }
                      );
                    }
                    return; // Exit once we find a match
                  }
                }
              }
            }
          }

          // Note: If no transition mapping is found, the click is silently ignored
          // This can happen if the PlantUML label doesn't match any workflow trigger text
        });
      }
    }
  }

  /**
   * Render fallback diagram if PlantUML fails
   */
  private renderFallbackDiagram(): void {
    const fallbackDiv = document.createElement('div');
    fallbackDiv.style.padding = '20px';
    fallbackDiv.style.border = '2px dashed #94a3b8';
    fallbackDiv.style.borderRadius = '8px';
    fallbackDiv.style.backgroundColor = '#f8fafc';
    fallbackDiv.style.textAlign = 'center';

    fallbackDiv.innerHTML = `
      <div style="color: #64748b; margin-bottom: 20px;">
        <strong>⚠️ PlantUML diagram failed to load</strong><br>
        <span style="font-size: 14px;">Using fallback interactive view</span>
      </div>
    `;

    this.container.appendChild(fallbackDiv);
  }

  /**
   * Show error message
   */
  private showError(message: string): void {
    console.error(message);
  }

  /**
   * Clear the container
   */
  public clear(): void {
    this.container.innerHTML = '';
  }
}
