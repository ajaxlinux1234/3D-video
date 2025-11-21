/**
 * NewProjectWizard - Dialog for creating new projects
 * 
 * Features:
 * - Create blank project
 * - Create from template
 * - Template preview and selection
 */

import { useState } from 'react';
import { useProjectManager } from '../core/useProjectManager';
import type { ProjectTemplate } from '../core/ProjectManager';
import './NewProjectWizard.css';

interface NewProjectWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewProjectWizard({ isOpen, onClose }: NewProjectWizardProps) {
  const { createNewProject, createFromTemplate, getTemplates } = useProjectManager();
  const [projectName, setProjectName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null);
  const [step, setStep] = useState<'name' | 'template'>('name');

  const templates = getTemplates();

  if (!isOpen) return null;

  const handleCreate = () => {
    const name = projectName.trim() || '未命名项目';
    
    if (selectedTemplate && selectedTemplate.id !== 'blank') {
      createFromTemplate(selectedTemplate, name);
    } else {
      createNewProject(name);
    }
    
    // Reset and close
    setProjectName('');
    setSelectedTemplate(null);
    setStep('name');
    onClose();
  };

  const handleTemplateSelect = (template: ProjectTemplate) => {
    setSelectedTemplate(template);
  };

  const handleNext = () => {
    if (step === 'name') {
      setStep('template');
    } else {
      handleCreate();
    }
  };

  const handleBack = () => {
    if (step === 'template') {
      setStep('name');
    }
  };

  return (
    <div className="wizard-overlay" onClick={onClose}>
      <div className="wizard-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="wizard-header">
          <h2>新建项目</h2>
          <button className="wizard-close" onClick={onClose}>×</button>
        </div>

        <div className="wizard-content">
          {step === 'name' && (
            <div className="wizard-step">
              <h3>项目名称</h3>
              <input
                type="text"
                className="wizard-input"
                placeholder="输入项目名称"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleNext();
                  }
                }}
              />
              <p className="wizard-hint">
                为你的视频项目起一个名字，或留空使用默认名称
              </p>
            </div>
          )}

          {step === 'template' && (
            <div className="wizard-step">
              <h3>选择模板</h3>
              <div className="template-grid">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className={`template-card ${selectedTemplate?.id === template.id ? 'selected' : ''}`}
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <div className="template-icon">
                      {template.id === 'blank' && '📄'}
                      {template.id === 'fast-paced' && '⚡'}
                      {template.id === 'slow-paced' && '🌙'}
                      {template.id === 'glitch-style' && '🎮'}
                      {template.id === 'cinematic' && '🎬'}
                      {template.id === 'dreamy' && '✨'}
                    </div>
                    <h4>{template.name}</h4>
                    <p>{template.description}</p>
                    <div className="template-meta">
                      <span>{template.config.fps} FPS</span>
                      {template.config.defaultTransition && (
                        <span>转场: {template.config.defaultTransition.type}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="wizard-footer">
          {step === 'template' && (
            <button className="wizard-button secondary" onClick={handleBack}>
              上一步
            </button>
          )}
          <button
            className="wizard-button primary"
            onClick={handleNext}
            disabled={step === 'template' && !selectedTemplate}
          >
            {step === 'name' ? '下一步' : '创建项目'}
          </button>
        </div>
      </div>
    </div>
  );
}
