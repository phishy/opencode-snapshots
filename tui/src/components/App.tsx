import React, { useState, useEffect } from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import { ProjectList } from './ProjectList.js';
import { ProjectDetail } from './ProjectDetail.js';
import { Search } from './Search.js';
import { colors } from '../theme.js';

type Screen = 'list' | 'detail' | 'search';

interface AppState {
  screen: Screen;
  selectedProjectId: string | null;
}

export function App() {
  const { exit } = useApp();
  const [state, setState] = useState<AppState>({
    screen: 'list',
    selectedProjectId: null,
  });
  const [showHelp, setShowHelp] = useState(false);

  useInput((input, key) => {
    if (input === 'q' && state.screen === 'list') {
      exit();
      return;
    }

    if (input === '?') {
      setShowHelp((h) => !h);
      return;
    }

    if (key.escape) {
      if (showHelp) {
        setShowHelp(false);
      } else if (state.screen === 'search') {
        setState((s) => ({ ...s, screen: 'list' }));
      }
      return;
    }

    if (input === '/' || input === 's') {
      if (state.screen !== 'search') {
        setState((s) => ({ ...s, screen: 'search' }));
      }
      return;
    }
  });

  const handleSelectProject = (projectId: string) => {
    setState({ screen: 'detail', selectedProjectId: projectId });
  };

  const handleBack = () => {
    setState({ screen: 'list', selectedProjectId: null });
  };

  const handleSearchSelect = (projectId: string) => {
    setState({ screen: 'detail', selectedProjectId: projectId });
  };

  if (showHelp) {
    return <HelpOverlay onClose={() => setShowHelp(false)} />;
  }

  return (
    <Box flexDirection="column" padding={1}>
      <Header />
      <Box marginTop={1}>
        {state.screen === 'list' && (
          <ProjectList onSelect={handleSelectProject} />
        )}
        {state.screen === 'detail' && state.selectedProjectId && (
          <ProjectDetail
            projectId={state.selectedProjectId}
            onBack={handleBack}
          />
        )}
        {state.screen === 'search' && (
          <Search
            onSelect={handleSearchSelect}
            onClose={() => setState((s) => ({ ...s, screen: 'list' }))}
          />
        )}
      </Box>
    </Box>
  );
}

function Header() {
  return (
    <Box>
      <Text color={colors.text.strong} bold>
        OpenCode Snapshot Browser
      </Text>
      <Text color={colors.text.weak}> {' '} </Text>
      <Text color={colors.text.weak}>
        Press ? for help
      </Text>
    </Box>
  );
}

function HelpOverlay({ onClose }: { onClose: () => void }) {
  useInput((input, key) => {
    if (input === '?' || key.escape || input === 'q') {
      onClose();
    }
  });

  const shortcuts = [
    ['Navigation', ''],
    ['  j/k or arrows', 'Move up/down'],
    ['  Enter', 'Select item'],
    ['  Esc', 'Go back'],
    ['  Tab', 'Switch tabs'],
    ['', ''],
    ['Actions', ''],
    ['  /', 'Open search'],
    ['  d', 'Download snapshot'],
    ['  space', 'Toggle before/after diff'],
    ['', ''],
    ['General', ''],
    ['  ?', 'Toggle help'],
    ['  q', 'Quit (from project list)'],
  ];

  return (
    <Box flexDirection="column" padding={1}>
      <Text color={colors.text.strong} bold>
        Keyboard Shortcuts
      </Text>
      <Box marginTop={1} flexDirection="column">
        {shortcuts.map(([key, desc], i) => (
          <Box key={i}>
            {key === '' ? (
              <Text> </Text>
            ) : desc === '' ? (
              <Text color={colors.blue} bold>{key}</Text>
            ) : (
              <>
                <Box width={20}>
                  <Text color={colors.text.base}>{key}</Text>
                </Box>
                <Text color={colors.text.weak}>{desc}</Text>
              </>
            )}
          </Box>
        ))}
      </Box>
      <Box marginTop={1}>
        <Text color={colors.text.weak}>Press ? or Esc to close</Text>
      </Box>
    </Box>
  );
}
