import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AppError, ErrorType, errorLogger } from '../utils/errors';
import './ErrorBoundary.css';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * 全局错误边界组件
 * 捕获React组件树中的错误并提供友好的错误界面
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // 记录错误
    const appError = error instanceof AppError 
      ? error 
      : new AppError(
          ErrorType.UNKNOWN_ERROR,
          error.message,
          { componentStack: errorInfo.componentStack }
        );
    
    errorLogger.log(appError);
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null
    });
  };

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleReset);
      }

      return (
        <div className="error-boundary">
          <div className="error-boundary-content">
            <div className="error-icon">⚠️</div>
            <h1>出错了</h1>
            <p className="error-message">
              应用遇到了一个意外错误，我们已经记录了这个问题。
            </p>
            <details className="error-details">
              <summary>错误详情</summary>
              <pre>{this.state.error.message}</pre>
              {this.state.error.stack && (
                <pre className="error-stack">{this.state.error.stack}</pre>
              )}
            </details>
            <div className="error-actions">
              <button onClick={this.handleReset} className="btn-primary">
                重新加载
              </button>
              <button 
                onClick={() => window.location.reload()} 
                className="btn-secondary"
              >
                刷新页面
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
