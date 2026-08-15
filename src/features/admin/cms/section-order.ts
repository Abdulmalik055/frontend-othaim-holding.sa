export function getNextCmsSectionOrder(sections: ReadonlyArray<{ order: number }>) {
  return (
    sections.reduce(
      (highestOrder, section) => Math.max(highestOrder, section.order),
      sections.length
    ) + 1
  );
}

export function reorderCmsSections<T extends { id: string; order: number }>(
  sections: T[],
  sectionIds: string[]
) {
  if (sections.length !== sectionIds.length || new Set(sectionIds).size !== sections.length) {
    return sections;
  }

  const sectionsById = new Map(sections.map((section) => [section.id, section]));
  const reorderedSections: T[] = [];

  for (const [index, sectionId] of sectionIds.entries()) {
    const section = sectionsById.get(sectionId);
    if (!section) return sections;
    reorderedSections.push({ ...section, order: index + 1 });
  }

  return reorderedSections;
}
