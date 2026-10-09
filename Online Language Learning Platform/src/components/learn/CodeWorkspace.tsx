import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import { 
  Play, 
  RotateCcw, 
  Copy, 
  Check, 
  Terminal, 
  Clock, 
  Cpu, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Eye,
  Settings2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Button } from '../common/Button';
import { executeCode, ExecutionResult, MONACO_LANGUAGE_MAP } from '../../lib/codeExecution';

interface CodeWorkspaceProps {
  initialCode: string;
  languageSlug: string;
  expectedOutput?: string | null;
  onCodeChange?: (code: string) => void;
}

export const CodeWorkspace: React.FC<CodeWorkspaceProps> = ({
  initialCode,
  languageSlug,
  expectedOutput,
  onCodeChange,
}) => {
  const [code, setCode] = useState(initialCode);
  const [stdin, setStdin] = useState('');
  const [showStdin, setShowStdin] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'console' | 'preview'>('console');
  const [fontSize, setFontSize] = useState<number>(14);

  const monacoLang = MONACO_LANGUAGE_MAP[languageSlug.toLowerCase()] || 'plaintext';
  const isWebLanguage = ['html', 'css'].includes(languageSlug.toLowerCase());

  const handleEditorChange = (value: string | undefined) => {
    const updated = value || '';
    setCode(updated);
    if (onCodeChange) {
      onCodeChange(updated);
    }
  };

  const handleRun = async () => {
    setIsRunning(true);
    setExecutionResult(null);
    try {
      const result = await executeCode(languageSlug, code, stdin);
      setExecutionResult(result);
      if (isWebLanguage) {
        setActiveTab('preview');
      } else {
        setActiveTab('console');
      }
    } finally {
      setIsRunning(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('Reset code back to the original lesson example? Any unsaved edits will be lost.')) {
      setCode(initialCode);
      if (onCodeChange) {
        onCodeChange(initialCode);
      }
      setExecutionResult(null);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-[#0d111b] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
      {/* Editor Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2.5 bg-[#101522] border-b border-slate-800 gap-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-rose-500/80" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
          </div>
          <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded bg-slate-800 text-slate-300">
            main.{languageSlug === 'cpp' ? 'cpp' : languageSlug === 'python' ? 'py' : languageSlug === 'java' ? 'java' : languageSlug}
          </span>
          <span className="text-[11px] text-slate-500 hidden sm:inline">Monaco Editor • Isolated Runner</span>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-2">
          {/* Font size adjustments */}
          <div className="hidden sm:flex items-center gap-1 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-xs text-slate-400">
            <button
              onClick={() => setFontSize((f) => Math.max(11, f - 1))}
              className="hover:text-white px-1 font-mono font-bold"
              title="Decrease font size"
            >
              A-
            </button>
            <span className="font-mono text-[10px] text-slate-500">{fontSize}px</span>
            <button
              onClick={() => setFontSize((f) => Math.min(20, f + 1))}
              className="hover:text-white px-1 font-mono font-bold"
              title="Increase font size"
            >
              A+
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Copy code"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>

          <button
            onClick={handleReset}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Reset code"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Stdin toggle button for languages that read input */}
          {!isWebLanguage && (
            <button
              onClick={() => setShowStdin(!showStdin)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
                showStdin ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40' : 'bg-slate-800/80 text-slate-400 hover:text-white'
              }`}
            >
              <span>Stdin</span>
              {showStdin ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}

          <Button
            variant="primary"
            size="sm"
            onClick={handleRun}
            isLoading={isRunning}
            leftIcon={<Play className="w-3.5 h-3.5 fill-current" />}
            className="shadow-md shadow-indigo-600/20 text-xs px-3 py-1.5"
          >
            Run Code
          </Button>
        </div>
      </div>

      {/* Stdin Drawer (when enabled) */}
      {showStdin && (
        <div className="bg-[#0b0e17] border-b border-slate-800 p-3 space-y-1 text-xs">
          <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
            Standard Input (stdin):
          </label>
          <textarea
            value={stdin}
            onChange={(e) => setStdin(e.target.value)}
            placeholder="Type user input here (e.g. numbers or strings read by cin, input(), Scanner)..."
            rows={2}
            className="w-full bg-[#101522] border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 font-mono text-xs focus:outline-none focus:border-indigo-500"
          />
        </div>
      )}

      {/* Editor Workspace Area */}
      <div className="flex-1 min-h-[300px] relative">
        <Editor
          height="100%"
          language={monacoLang}
          value={code}
          onChange={handleEditorChange}
          theme="vs-dark"
          options={{
            fontSize: fontSize,
            fontFamily: "'Fira Code', 'JetBrains Mono', Menlo, Monaco, Consolas, monospace",
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 4,
            padding: { top: 12, bottom: 12 },
            lineNumbers: 'on',
            lineDecorationsWidth: 6,
            renderLineHighlight: 'all',
            cursorBlinking: 'smooth',
            wordWrap: 'on',
          }}
          loading={
            <div className="flex items-center justify-center h-full text-slate-500 text-xs gap-2">
              <span className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              Loading Monaco Workspace...
            </div>
          }
        />
      </div>

      {/* Terminal Output / Console Drawer */}
      <div className="h-64 sm:h-72 border-t border-slate-800 bg-[#080b11] flex flex-col">
        {/* Terminal Tab Bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-[#0c0f18] border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('console')}
              className={`flex items-center gap-1.5 text-xs font-semibold pb-0.5 border-b-2 transition-colors ${
                activeTab === 'console'
                  ? 'border-indigo-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Console Output</span>
            </button>

            {isWebLanguage && (
              <button
                onClick={() => setActiveTab('preview')}
                className={`flex items-center gap-1.5 text-xs font-semibold pb-0.5 border-b-2 transition-colors ${
                  activeTab === 'preview'
                    ? 'border-indigo-500 text-white'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Sandbox Browser Preview</span>
              </button>
            )}
          </div>

          {/* Telemetry info when execution finished */}
          {executionResult && (
            <div className="flex items-center gap-3 text-[11px] font-mono">
              {executionResult.isSuccess ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {executionResult.status.description}
                </span>
              ) : (
                <span className="text-rose-400 flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5" />
                  {executionResult.status.description}
                </span>
              )}

              {executionResult.time && (
                <span className="text-slate-400 hidden sm:flex items-center gap-1">
                  <Clock className="w-3 h-3 text-indigo-400" />
                  {(parseFloat(executionResult.time) * 1000).toFixed(0)}ms
                </span>
              )}

              {executionResult.memory !== null && executionResult.memory > 0 && (
                <span className="text-slate-400 hidden sm:flex items-center gap-1">
                  <Cpu className="w-3 h-3 text-purple-400" />
                  {executionResult.memory} KB
                </span>
              )}
            </div>
          )}
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 p-4 overflow-auto font-mono text-xs">
          {activeTab === 'preview' && isWebLanguage ? (
            <div className="w-full h-full bg-white rounded-lg overflow-hidden">
              <iframe
                title="sandbox-preview"
                srcDoc={code}
                className="w-full h-full border-0"
                sandbox="allow-scripts"
              />
            </div>
          ) : isRunning ? (
            <div className="flex items-center gap-2 text-indigo-400 h-full">
              <span className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <span>Transmitting code to isolated execution container...</span>
            </div>
          ) : executionResult ? (
            <div className="space-y-3">
              {/* Compile Error (if any) */}
              {executionResult.compile_output && (
                <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-lg text-rose-300 whitespace-pre-wrap">
                  <div className="text-[10px] uppercase font-bold text-rose-400 mb-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Compilation Error
                  </div>
                  {executionResult.compile_output}
                </div>
              )}

              {/* Stderr Error (if any) */}
              {executionResult.stderr && (
                <div className="p-3 bg-rose-950/30 border border-rose-800/40 rounded-lg text-rose-300 whitespace-pre-wrap">
                  <div className="text-[10px] uppercase font-bold text-rose-400 mb-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Runtime Error (stderr)
                  </div>
                  {executionResult.stderr}
                </div>
              )}

              {/* Standard Output (stdout) */}
              {executionResult.stdout ? (
                <div className="text-emerald-300 whitespace-pre-wrap">
                  {executionResult.stdout}
                </div>
              ) : !executionResult.compile_output && !executionResult.stderr ? (
                <div className="text-slate-500 italic">Program finished execution with no standard output.</div>
              ) : null}

              {/* Compare with Expected Output (if specified) */}
              {expectedOutput && executionResult.stdout && (
                <div className="pt-2 border-t border-slate-800 text-[11px]">
                  {executionResult.stdout.trim() === expectedOutput.trim() ? (
                    <span className="text-emerald-400 flex items-center gap-1 font-sans">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Output perfectly matches expected lesson solution!
                    </span>
                  ) : (
                    <div className="text-amber-400/90 font-sans space-y-1">
                      <div className="flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> Output differs from expected lesson output:
                      </div>
                      <div className="font-mono text-slate-400 bg-slate-900/60 p-2 rounded border border-slate-800">
                        Expected: {expectedOutput}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-slate-500 flex flex-col justify-center items-center h-full space-y-2">
              <Terminal className="w-8 h-8 opacity-40" />
              <p className="text-xs">Press <strong className="text-slate-300">Run Code</strong> to execute this program in the isolated sandbox.</p>
              {expectedOutput && (
                <p className="text-[11px] text-slate-500 font-sans">
                  Target expected output: <code className="text-indigo-400">{expectedOutput}</code>
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
