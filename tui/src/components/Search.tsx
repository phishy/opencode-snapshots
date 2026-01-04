import React, { useState, useEffect, useCallback } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import { colors, formatRelativeTime, truncate, getVisibleWindow } from '../theme.js';
import { searchPrompts, type SearchResult } from '../data.js';

interface Props {
  onSelect: (projectId: string) => void;
  onClose: () => void;
}

export function Search({ onSelect, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searching, setSearching] = useState(false);
  const [searchedOnce, setSearchedOnce] = useState(false);

  const doSearch = useCallback((q: string) => {
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    setSearchedOnce(true);
    setTimeout(() => {
      const r = searchPrompts(q, 20);
      setResults(r);
      setSearching(false);
      setSelectedIndex(0);
    }, 0);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      doSearch(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, doSearch]);

  useInput((input, key) => {
    if (key.escape) {
      onClose();
      return;
    }

    if (results.length === 0) return;

    if (key.upArrow) {
      setSelectedIndex((i) => Math.max(0, i - 1));
    } else if (key.downArrow) {
      setSelectedIndex((i) => Math.min(results.length - 1, i + 1));
    } else if (key.return && results[selectedIndex]) {
      onSelect(results[selectedIndex].projectId);
    }
  });

  return (
    <Box flexDirection="column" width="100%">
      <Box marginBottom={1}>
        <Text color={colors.text.strong} bold>
          Search
        </Text>
        <Text color={colors.text.weak}> - Esc to close</Text>
      </Box>

      <Box marginBottom={1}>
        <Text color={colors.blue}>{'> '}</Text>
        <TextInput
          value={query}
          onChange={setQuery}
          placeholder="Search conversations..."
        />
      </Box>

      {searching && (
        <Box>
          <Text color={colors.text.weak}>Searching...</Text>
          {!searchedOnce && (
            <Text color={colors.text.weak} dimColor>
              {' '}(first search may take a moment to build index)
            </Text>
          )}
        </Box>
      )}

      {!searching && query.length >= 2 && results.length === 0 && (
        <Box>
          <Text color={colors.text.weak}>No results found</Text>
        </Box>
      )}

      {!searching && results.length > 0 && (
        <Box flexDirection="column">
          <Box marginBottom={1}>
            <Text color={colors.text.weak}>
              {results.length} results
            </Text>
            {selectedIndex > 0 && <Text color={colors.text.weak}> [{selectedIndex + 1}/{results.length}]</Text>}
          </Box>
          {(() => {
            const { items: visibleResults, startIndex } = getVisibleWindow(results, selectedIndex, 6);
            return visibleResults.map((result, idx) => (
              <SearchResultRow
                key={`${result.sessionId}-${result.messageId}`}
                result={result}
                isSelected={startIndex + idx === selectedIndex}
                query={query}
              />
            ));
          })()}
        </Box>
      )}

      {query.length < 2 && (
        <Box>
          <Text color={colors.text.weak} dimColor>
            Type at least 2 characters to search
          </Text>
        </Box>
      )}
    </Box>
  );
}

interface SearchResultRowProps {
  result: SearchResult;
  isSelected: boolean;
  query: string;
}

function SearchResultRow({ result, isSelected, query }: SearchResultRowProps) {
  const snippetLength = 60;
  const lowerText = result.text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const matchIndex = lowerText.indexOf(lowerQuery);

  let snippet = result.text;
  if (matchIndex > 20) {
    snippet = '...' + result.text.slice(matchIndex - 15);
  }
  snippet = truncate(snippet, snippetLength);

  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box>
        <Text color={isSelected ? colors.blue : colors.text.weak}>
          {isSelected ? '>' : ' '}{' '}
        </Text>
        <Text color={isSelected ? colors.text.strong : colors.text.base} bold={isSelected}>
          {truncate(result.projectName, 20)}
        </Text>
        <Text color={colors.text.weak}>{' / '}</Text>
        <Text color={colors.text.weak}>
          {truncate(result.sessionTitle, 30)}
        </Text>
        <Text color={colors.text.weak}>{' '}</Text>
        <Text color={colors.text.weak} dimColor>
          {formatRelativeTime(result.timestamp)}
        </Text>
      </Box>
      <Box marginLeft={2}>
        <Text color={result.role === 'user' ? colors.blue : colors.text.weak}>
          [{result.role}]
        </Text>
        <Text color={colors.text.weak}>{' '}</Text>
        <Text color={colors.text.base}>{snippet}</Text>
      </Box>
    </Box>
  );
}
