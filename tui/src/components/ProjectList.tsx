import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { colors, formatRelativeTime, truncate, getVisibleWindow } from '../theme.js';
import { getProjects, type Project } from '../data.js';

interface Props {
  onSelect: (projectId: string) => void;
}

export function ProjectList({ onSelect }: Props) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const data = getProjects();
        setProjects(data);
      } finally {
        setLoading(false);
      }
    };
    loadProjects();
  }, []);

  useInput((input, key) => {
    if (loading || projects.length === 0) return;

    if (key.upArrow || input === 'k') {
      setSelectedIndex((i) => Math.max(0, i - 1));
    } else if (key.downArrow || input === 'j') {
      setSelectedIndex((i) => Math.min(projects.length - 1, i + 1));
    } else if (key.return) {
      onSelect(projects[selectedIndex].id);
    }
  });

  if (loading) {
    return (
      <Box>
        <Text color={colors.text.weak}>Loading projects...</Text>
      </Box>
    );
  }

  if (projects.length === 0) {
    return (
      <Box flexDirection="column">
        <Text color={colors.text.weak}>No projects found.</Text>
        <Text color={colors.text.weak} dimColor>
          OpenCode data is read from ~/.local/share/opencode/
        </Text>
      </Box>
    );
  }

  const { items: visibleProjects, startIndex } = getVisibleWindow(projects, selectedIndex, 15);

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text color={colors.text.strong} bold>
          Projects
        </Text>
        <Text color={colors.text.weak}> ({projects.length})</Text>
        {startIndex > 0 && <Text color={colors.text.weak}> [{selectedIndex + 1}/{projects.length}]</Text>}
      </Box>

      {visibleProjects.map((project, index) => (
        <ProjectRow
          key={project.id}
          project={project}
          isSelected={startIndex + index === selectedIndex}
        />
      ))}

      <Box marginTop={1}>
        <Text color={colors.text.weak} dimColor>
          j/k to navigate, Enter to select, / to search, q to quit
        </Text>
      </Box>
    </Box>
  );
}

interface ProjectRowProps {
  project: Project;
  isSelected: boolean;
}

function ProjectRow({ project, isSelected }: ProjectRowProps) {
  const indicator = isSelected ? '>' : ' ';

  return (
    <Box>
      <Text color={isSelected ? colors.blue : colors.text.weak}>
        {indicator}{' '}
      </Text>
      <Box width={20}>
        <Text color={colors.text.strong} bold={isSelected}>
          {truncate(project.name, 18)}
        </Text>
      </Box>
      <Box width={14}>
        <Text color={colors.text.weak}>
          {project.sessionCount} sessions
        </Text>
      </Box>
      {project.changeCount > 0 ? (
        <Box width={14}>
          <Text color={colors.green}>+{project.changeCount} changes</Text>
        </Box>
      ) : (
        <Box width={14}>
          <Text color={colors.text.weak}> </Text>
        </Box>
      )}
      {project.lastSession && (
        <Box>
          <Text color={colors.text.weak}>
            {formatRelativeTime(project.lastSession.updated)}
          </Text>
        </Box>
      )}
    </Box>
  );
}
