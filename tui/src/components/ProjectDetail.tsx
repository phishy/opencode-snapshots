import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { colors, formatRelativeTime, truncate, formatDate, getVisibleWindow } from '../theme.js';
import fs from 'fs';
import path from 'path';
import os from 'os';
import {
  getProject,
  getSessionChanges,
  getSnapshots,
  getSnapshotFiles,
  getFileContent,
  getSnapshotArchive,
  type Project,
  type SessionChange,
  type Snapshot,
  type FileEntry,
} from '../data.js';

interface Props {
  projectId: string;
  onBack: () => void;
}

type Tab = 'changes' | 'snapshots';

export function ProjectDetail({ projectId, onBack }: Props) {
  const [project, setProject] = useState<Project | null>(null);
  const [tab, setTab] = useState<Tab>('snapshots');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const data = getProject(projectId);
    setProject(data);
    setLoading(false);
  }, [projectId]);

  useInput((input, key) => {
    if (key.tab) {
      setTab((t) => (t === 'changes' ? 'snapshots' : 'changes'));
    }
  });

  if (loading) {
    return (
      <Box>
        <Text color={colors.text.weak}>Loading...</Text>
      </Box>
    );
  }

  if (!project) {
    return (
      <Box>
        <Text color={colors.red}>Project not found</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text color={colors.text.weak}>{'<'} </Text>
        <Text color={colors.blue}>Esc to go back</Text>
      </Box>

      <Box marginBottom={1} flexDirection="column">
        <Text color={colors.text.strong} bold>
          {project.name}
        </Text>
        <Text color={colors.text.weak} dimColor>
          {truncate(project.worktree, 60)}
        </Text>
        <Box marginTop={1}>
          <Text color={colors.text.weak}>
            <Text color={colors.text.base}>{project.sessionCount}</Text> sessions
          </Text>
          <Text color={colors.text.weak}>{'  '}</Text>
          <Text color={colors.green}>
            <Text>{project.changeCount}</Text> with changes
          </Text>
        </Box>
      </Box>

      <Tabs activeTab={tab} onTabChange={setTab} />

      <Box marginTop={1}>
        {tab === 'changes' ? (
          <ChangesTab projectId={projectId} onBack={onBack} />
        ) : (
          <SnapshotsTab projectId={projectId} onBack={onBack} />
        )}
      </Box>
    </Box>
  );
}

function Tabs({
  activeTab,
  onTabChange,
}: {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}) {
  return (
    <Box>
      <Text color={activeTab === 'snapshots' ? colors.blue : colors.text.weak}>
        {activeTab === 'snapshots' ? '[' : ' '}
      </Text>
      <Text
        color={activeTab === 'snapshots' ? colors.text.strong : colors.text.weak}
        bold={activeTab === 'snapshots'}
      >
        Snapshots
      </Text>
      <Text color={activeTab === 'snapshots' ? colors.blue : colors.text.weak}>
        {activeTab === 'snapshots' ? ']' : ' '}
      </Text>
      <Text>  </Text>
      <Text color={activeTab === 'changes' ? colors.blue : colors.text.weak}>
        {activeTab === 'changes' ? '[' : ' '}
      </Text>
      <Text
        color={activeTab === 'changes' ? colors.text.strong : colors.text.weak}
        bold={activeTab === 'changes'}
      >
        Session Changes
      </Text>
      <Text color={activeTab === 'changes' ? colors.blue : colors.text.weak}>
        {activeTab === 'changes' ? ']' : ' '}
      </Text>
      <Text color={colors.text.weak} dimColor>
        {'  '}Tab to switch
      </Text>
    </Box>
  );
}

function ChangesTab({ projectId, onBack }: { projectId: string; onBack: () => void }) {
  const [changes, setChanges] = useState<SessionChange[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedFile, setSelectedFile] = useState<number>(0);
  const [showAfter, setShowAfter] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const data = getSessionChanges(projectId);
    setChanges(data);
    setLoading(false);
  }, [projectId]);

  useInput((input, key) => {
    if (key.escape) {
      onBack();
      return;
    }

    if (loading || changes.length === 0) return;

    const currentChange = changes[selectedIndex];
    const maxFileIndex = currentChange?.files?.length - 1 || 0;

    if (key.upArrow || input === 'k') {
      if (selectedFile > 0) {
        setSelectedFile((i) => i - 1);
      } else if (selectedIndex > 0) {
        setSelectedIndex((i) => i - 1);
        const prevChange = changes[selectedIndex - 1];
        setSelectedFile((prevChange?.files?.length || 1) - 1);
      }
    } else if (key.downArrow || input === 'j') {
      if (selectedFile < maxFileIndex) {
        setSelectedFile((i) => i + 1);
      } else if (selectedIndex < changes.length - 1) {
        setSelectedIndex((i) => i + 1);
        setSelectedFile(0);
      }
    } else if (input === ' ') {
      setShowAfter((s) => !s);
    }
  });

  if (loading) {
    return (
      <Box>
        <Text color={colors.text.weak}>Loading changes...</Text>
      </Box>
    );
  }

  if (changes.length === 0) {
    return (
      <Box flexDirection="column">
        <Text color={colors.text.weak}>No file changes recorded.</Text>
        <Text color={colors.text.weak} dimColor>
          Changes are recorded when OpenCode modifies files.
        </Text>
      </Box>
    );
  }

  const currentChange = changes[selectedIndex];
  const currentFile = currentChange?.files?.[selectedFile];
  const { items: visibleChanges, startIndex: changesStart } = getVisibleWindow(changes, selectedIndex, 8);

  return (
    <Box flexDirection="column">
      <Box flexDirection="row" height={15}>
        <Box flexDirection="column" width={40} marginRight={2}>
          {visibleChanges.map((change, idx) => {
            const actualIdx = changesStart + idx;
            return (
              <Box key={change.sessionId} flexDirection="column">
                <Box>
                  <Text
                    color={actualIdx === selectedIndex ? colors.blue : colors.text.weak}
                  >
                    {actualIdx === selectedIndex ? '>' : ' '}{' '}
                  </Text>
                  <Text
                    color={actualIdx === selectedIndex ? colors.text.strong : colors.text.base}
                    bold={actualIdx === selectedIndex}
                  >
                    {truncate(change.title, 32)}
                  </Text>
                </Box>
                {actualIdx === selectedIndex &&
                  change.files.map((file, fIdx) => (
                    <Box key={file.file} marginLeft={2}>
                      <Text color={fIdx === selectedFile ? colors.blue : colors.text.weak}>
                        {fIdx === selectedFile ? '>' : ' '}{' '}
                      </Text>
                      <Text
                        color={fIdx === selectedFile ? colors.text.strong : colors.text.weak}
                      >
                        {truncate(file.file, 30)}
                      </Text>
                    </Box>
                  ))}
              </Box>
            );
          })}
        </Box>

        <Box flexDirection="column" flexGrow={1}>
          {currentFile && (
            <>
              <Box marginBottom={1}>
                <Text color={colors.text.strong}>{currentFile.file}</Text>
                <Text color={colors.text.weak}>{' - '}</Text>
                <Text color={showAfter ? colors.green : colors.red}>
                  {showAfter ? 'After' : 'Before'}
                </Text>
                <Text color={colors.text.weak} dimColor>
                  {' '}(space to toggle)
                </Text>
              </Box>
              <Box flexDirection="column" height={12} overflowY="hidden">
                {(showAfter ? currentFile.after : currentFile.before)
                  .split('\n')
                  .slice(0, 12)
                  .map((line, i) => (
                    <Text key={i} color={colors.text.base}>
                      {truncate(line, 60)}
                    </Text>
                  ))}
              </Box>
            </>
          )}
        </Box>
      </Box>

      <Box marginTop={1}>
        <Text color={colors.text.weak} dimColor>
          j/k to navigate, space to toggle before/after
        </Text>
      </Box>
    </Box>
  );
}

function SnapshotsTab({ projectId, onBack }: { projectId: string; onBack: () => void }) {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [fileContent, setFileContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'files' | 'content'>('list');
  const [downloadStatus, setDownloadStatus] = useState<string | null>(null);
  const [contentScroll, setContentScroll] = useState(0);

  useEffect(() => {
    const data = getSnapshots(projectId);
    setSnapshots(data);
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    if (viewMode === 'files' && snapshots[selectedIndex]) {
      const snapshot = snapshots[selectedIndex];
      const fileList = getSnapshotFiles(projectId, snapshot.hash);
      setFiles(fileList);
      setSelectedFileIndex(0);
    }
  }, [viewMode, selectedIndex, projectId, snapshots]);

  useEffect(() => {
    if (viewMode === 'content' && files[selectedFileIndex]) {
      const file = files[selectedFileIndex];
      const content = getFileContent(projectId, file.hash);
      setFileContent(content);
      setContentScroll(0);
    }
  }, [viewMode, selectedFileIndex, projectId, files]);

  useInput((input, key) => {
    if (loading) return;

    if (key.escape) {
      if (viewMode === 'content') {
        setViewMode('files');
      } else if (viewMode === 'files') {
        setViewMode('list');
      } else {
        onBack();
      }
      return;
    }

    if (viewMode === 'list') {
      if (snapshots.length === 0) return;
      if (key.upArrow || input === 'k') {
        setSelectedIndex((i) => Math.max(0, i - 1));
        setDownloadStatus(null);
      } else if (key.downArrow || input === 'j') {
        setSelectedIndex((i) => Math.min(snapshots.length - 1, i + 1));
        setDownloadStatus(null);
      } else if (key.return) {
        setViewMode('files');
      } else if (input === 'd') {
        const snapshot = snapshots[selectedIndex];
        if (snapshot) {
          setDownloadStatus('Downloading...');
          try {
            const archive = getSnapshotArchive(projectId, snapshot.hash);
            if (archive) {
              const downloadsDir = path.join(os.homedir(), 'Downloads');
              const filename = `snapshot-${snapshot.hash.slice(0, 8)}.zip`;
              const filepath = path.join(downloadsDir, filename);
              fs.writeFileSync(filepath, archive);
              setDownloadStatus(`Saved to ~/Downloads/${filename}`);
            } else {
              setDownloadStatus('Download failed: could not create archive');
            }
          } catch (err) {
            setDownloadStatus(`Download failed: ${err}`);
          }
        }
      }
    } else if (viewMode === 'files') {
      if (files.length === 0) return;
      if (key.upArrow || input === 'k') {
        setSelectedFileIndex((i) => Math.max(0, i - 1));
      } else if (key.downArrow || input === 'j') {
        setSelectedFileIndex((i) => Math.min(files.length - 1, i + 1));
      } else if (key.return) {
        setViewMode('content');
      } else if (input === 'd') {
        const snapshot = snapshots[selectedIndex];
        if (snapshot) {
          setDownloadStatus('Downloading...');
          try {
            const archive = getSnapshotArchive(projectId, snapshot.hash);
            if (archive) {
              const downloadsDir = path.join(os.homedir(), 'Downloads');
              const filename = `snapshot-${snapshot.hash.slice(0, 8)}.zip`;
              const filepath = path.join(downloadsDir, filename);
              fs.writeFileSync(filepath, archive);
              setDownloadStatus(`Saved to ~/Downloads/${filename}`);
            } else {
              setDownloadStatus('Download failed: could not create archive');
            }
          } catch (err) {
            setDownloadStatus(`Download failed: ${err}`);
          }
        }
      }
    } else if (viewMode === 'content') {
      const lines = fileContent.split('\n');
      const maxScroll = Math.max(0, lines.length - 15);
      if (key.upArrow || input === 'k') {
        setContentScroll((s) => Math.max(0, s - 1));
      } else if (key.downArrow || input === 'j') {
        setContentScroll((s) => Math.min(maxScroll, s + 1));
      } else if (key.pageUp || input === 'u') {
        setContentScroll((s) => Math.max(0, s - 10));
      } else if (key.pageDown || input === 'd') {
        setContentScroll((s) => Math.min(maxScroll, s + 10));
      } else if (input === 'g') {
        setContentScroll(0);
      } else if (input === 'G') {
        setContentScroll(maxScroll);
      }
    }
  });

  if (loading) {
    return (
      <Box>
        <Text color={colors.text.weak}>Loading snapshots...</Text>
        <Text color={colors.text.weak} dimColor>
          {' '}(this may take a moment)
        </Text>
      </Box>
    );
  }

  if (snapshots.length === 0) {
    return (
      <Box>
        <Text color={colors.text.weak}>No snapshots found.</Text>
      </Box>
    );
  }

  if (viewMode === 'content') {
    const file = files[selectedFileIndex];
    const lines = fileContent.split('\n');
    const visibleLines = lines.slice(contentScroll, contentScroll + 15);
    const totalLines = lines.length;
    return (
      <Box flexDirection="column">
        <Box marginBottom={1}>
          <Text color={colors.text.weak}>{'< '}</Text>
          <Text color={colors.blue}>Esc to go back</Text>
          <Text color={colors.text.weak}>{' - '}</Text>
          <Text color={colors.text.strong}>{file?.path}</Text>
          {totalLines > 15 && (
            <Text color={colors.text.weak}> [line {contentScroll + 1}-{Math.min(contentScroll + 15, totalLines)}/{totalLines}]</Text>
          )}
        </Box>
        <Box flexDirection="column" height={15} overflowY="hidden">
          {visibleLines.map((line, i) => (
            <Box key={contentScroll + i}>
              <Box width={5}>
                <Text color={colors.text.weak}>{contentScroll + i + 1}</Text>
              </Box>
              <Text color={colors.text.base}>{truncate(line, 70)}</Text>
            </Box>
          ))}
        </Box>
        <Box marginTop={1}>
          <Text color={colors.text.weak} dimColor>
            j/k to scroll, u/d for page up/down, g/G for top/bottom, Esc to go back
          </Text>
        </Box>
      </Box>
    );
  }

  if (viewMode === 'files') {
    const snapshot = snapshots[selectedIndex];
    const { items: visibleFiles, startIndex: filesStart } = getVisibleWindow(files, selectedFileIndex, 12);
    return (
      <Box flexDirection="column">
        <Box marginBottom={1}>
          <Text color={colors.text.weak}>{'< '}</Text>
          <Text color={colors.blue}>Esc to go back</Text>
          <Text color={colors.text.weak}>{' - '}</Text>
          <Text color={colors.text.strong}>
            {truncate(snapshot.hash, 12)}
          </Text>
          <Text color={colors.text.weak}>
            {' '}({files.length} files)
          </Text>
          {filesStart > 0 && <Text color={colors.text.weak}> [{selectedFileIndex + 1}/{files.length}]</Text>}
        </Box>
        <Box flexDirection="column" height={12} overflowY="hidden">
          {visibleFiles.map((file, idx) => {
            const actualIdx = filesStart + idx;
            return (
              <Box key={file.path}>
                <Text color={actualIdx === selectedFileIndex ? colors.blue : colors.text.weak}>
                  {actualIdx === selectedFileIndex ? '>' : ' '}{' '}
                </Text>
                <Text
                  color={actualIdx === selectedFileIndex ? colors.text.strong : colors.text.base}
                >
                  {truncate(file.path, 60)}
                </Text>
              </Box>
            );
          })}
        </Box>
        {downloadStatus && (
          <Box marginTop={1}>
            <Text color={downloadStatus.startsWith('Saved') ? colors.green : colors.yellow}>
              {downloadStatus}
            </Text>
          </Box>
        )}
        <Box marginTop={1}>
          <Text color={colors.text.weak} dimColor>
            j/k to navigate, Enter to view file, <Text color={colors.blue}>d</Text> to download ZIP, Esc to go back
          </Text>
        </Box>
      </Box>
    );
  }

  const { items: visibleSnapshots, startIndex: snapshotsStart } = getVisibleWindow(snapshots, selectedIndex, 12);

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text color={colors.text.strong}>
          {snapshots.length} snapshots
        </Text>
        {snapshotsStart > 0 && <Text color={colors.text.weak}> [{selectedIndex + 1}/{snapshots.length}]</Text>}
      </Box>
      <Box flexDirection="column" height={12} overflowY="hidden">
        {visibleSnapshots.map((snapshot, idx) => {
          const actualIdx = snapshotsStart + idx;
          return (
            <Box key={snapshot.hash}>
              <Text color={actualIdx === selectedIndex ? colors.blue : colors.text.weak}>
                {actualIdx === selectedIndex ? '>' : ' '}{' '}
              </Text>
              <Box width={16}>
                <Text color={colors.text.weak}>
                  {formatDate(snapshot.timestamp)}
                </Text>
              </Box>
              <Text> </Text>
              <Text color={actualIdx === selectedIndex ? colors.text.strong : colors.text.base}>
                {truncate(snapshot.sessionTitle || snapshot.hash, 45)}
              </Text>
            </Box>
          );
        })}
      </Box>
      {downloadStatus && (
        <Box marginTop={1}>
          <Text color={downloadStatus.startsWith('Saved') ? colors.green : colors.yellow}>
            {downloadStatus}
          </Text>
        </Box>
      )}
      <Box marginTop={1}>
        <Text color={colors.text.weak} dimColor>
          j/k to navigate, Enter to browse files, <Text color={colors.blue}>d</Text> to download ZIP
        </Text>
      </Box>
    </Box>
  );
}
