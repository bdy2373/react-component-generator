import { useState, useEffect } from 'react';
import { PromptInput } from './components/PromptInput';
import { ComponentCard } from './components/ComponentCard';
import { useComponentGenerator } from './hooks/useComponentGenerator';
import type { Provider } from './types';
import './App.css';

const PROVIDER_CONFIG = {
  anthropic: { label: 'Anthropic', placeholder: 'sk-ant-...' },
  google: { label: 'Google', placeholder: 'AIza...' },
} as const;

function App() {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [provider, setProvider] = useState<Provider>('google');
  const [envKeys, setEnvKeys] = useState<Record<Provider, boolean>>({
    anthropic: false,
    google: false,
  });
  const { components, isLoading, error, generate, removeComponent, clearAll } =
    useComponentGenerator();

  useEffect(() => {
    fetch('/api/config')
      .then((res) => res.json())
      .then((data) => setEnvKeys(data.envKeys))
      .catch(() => {});
  }, []);

  const hasEnvKey = envKeys[provider];

  const handleGenerate = (prompt: string) => {
    if (!apiKey.trim() && !hasEnvKey) {
      alert(`${PROVIDER_CONFIG[provider].label} API 키를 입력하거나 .env에 설정해주세요.`);
      return;
    }
    generate(prompt, apiKey || undefined, provider);
  };

  const handleProviderChange = (newProvider: Provider) => {
    setProvider(newProvider);
    setApiKey('');
  };

  const activeProvider = PROVIDER_CONFIG[provider].label;

  return (
    <div className="app">
      <nav className="desktop-bar" aria-label="작업 공간">
        <a className="desktop-brand" href="#"><span aria-hidden="true">▧</span> Component studio</a>
        <span className="desktop-description">아이디어를 화면으로 만드는 작업실</span>
        <span className="desktop-session"><i /> {isLoading ? '생성 중' : '작업 준비 완료'}</span>
      </nav>
      <header className="app-header">
        <div className="header-copy">
          <h1>A little prompt.<br />A new possibility.</h1>
          <p>머릿속에 떠오른 UI, 일단 만들어보세요.<br />한 문장의 아이디어가 움직이는 React 컴포넌트가 됩니다.</p>
        </div>
        <div className="studio-stamp" aria-hidden="true"><span className="stamp-symbol">{'{✳}'}</span><span>작은 아이디어도<br />멋진 시작이 되니까.</span></div>
      </header>

      <main className="workspace">
        <section className="composer-panel" aria-label="컴포넌트 생성">
          <PromptInput onGenerate={handleGenerate} isLoading={isLoading} />
        </section>

        <aside className="settings-panel" aria-label="실행 설정">
          <div className="settings-header">
            <h2>연결 설정</h2><span className="window-square" aria-hidden="true" />
          </div>
          <div className="provider-select">
            <label htmlFor="provider">AI 서비스</label>
            <select
              id="provider"
              value={provider}
              onChange={(e) => handleProviderChange(e.target.value as Provider)}
            >
              {Object.entries(PROVIDER_CONFIG).map(([key, { label }]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="api-key-input">
            <label htmlFor="api-key">
              API 키
            </label>
            <div className="api-key-field">
              <input
                id="api-key"
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={
                  hasEnvKey
                    ? '서버에 설정한 키 사용 중'
                    : PROVIDER_CONFIG[provider].placeholder
                }
              />
              <button
                className="btn-toggle-key"
                onClick={() => setShowKey(!showKey)}
                type="button"
              >
                {showKey ? '숨기기' : '보기'}
              </button>
            </div>
            <p className={`key-status ${hasEnvKey ? 'key-status--ready' : ''}`}>
              {hasEnvKey ? '서버 키가 연결되어 있습니다.' : 'API 키를 입력하면 생성을 시작할 수 있어요.'}
            </p>
          </div>
          <div className="settings-note"><span aria-hidden="true">✳</span><p>선택한 AI가 코드를 만들고,<br />이 작업실에서 바로 실행합니다.</p></div>
        </aside>
      </main>

      {error && (
        <div className="error-banner" role="alert">
          <p>{error}</p>
        </div>
      )}

      <section className="results-section">
        <div className="results-header">
          <div><h2>작업 보관함 <span className="result-count">{components.length}</span></h2><p>생성한 컴포넌트를 미리보고 코드를 가져가세요.</p></div>
          {components.length > 0 && <button className="btn-clear" onClick={clearAll}>전체 삭제</button>}
        </div>

        {components.length === 0 && !isLoading && (
          <div className="empty-state">
            <div className="empty-preview" aria-hidden="true">
              <div className="empty-window"><span />untitled.jsx</div>
              <div className="empty-canvas"><span className="empty-code">{'<'}<br /><span>✳</span><br />{'/>'}</span><div className="empty-cursor" /></div>
            </div>
            <div className="empty-copy"><span className="empty-caption">아직은 빈 캔버스</span><h2>첫 번째 아이디어를<br />기다리고 있어요.</h2><p>위에 원하는 UI를 적거나 예시를 골라보세요.<br />완성된 컴포넌트가 이곳에 나타납니다.</p></div>
          </div>
        )}

        {isLoading && (
          <div className="loading-card" role="status">
            <div className="loading-pulse" />
            <p>컴포넌트를 생성하고 있습니다...</p>
          </div>
        )}

        <div className="results-grid">
          {components.map((component) => (
            <ComponentCard
              key={component.id}
              component={component}
              onRemove={removeComponent}
              onRegenerate={handleGenerate}
              isLoading={isLoading}
            />
          ))}
        </div>
      </section>
      <footer className="studio-footer"><span>Component studio</span><span>{activeProvider}로 만드는 나만의 인터페이스</span><span>Made for your next idea.</span></footer>
    </div>
  );
}

export default App;
