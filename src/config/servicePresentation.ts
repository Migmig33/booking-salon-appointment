export const SERVICE_CATEGORIES = [
  { id: "all", label: "All" },
  { id: "cuts", label: "Cuts" },
  { id: "color", label: "Color" },
  { id: "balayage", label: "Balayage" },
  { id: "perms", label: "Perms" },
  { id: "treatments", label: "Treatments" },
  { id: "styling", label: "Styling" },
] as const

export const SERVICE_GROUPS = [
  { title: "Haircuts & Styling", categories: ["cuts", "styling"] },
  { title: "Hair Color", categories: ["color", "balayage"] },
  { title: "Perms & Texture", categories: ["perms"] },
  { title: "Treatments & Extensions", categories: ["treatments"] },
] as const
