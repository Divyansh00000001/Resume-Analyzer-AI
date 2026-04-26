export interface JobRoleDef {
  slug: string;
  title: string;
  category: string;
  description: string;
  coreSkills: string[];
  niceToHaveSkills: string[];
}

export const JOB_ROLES: JobRoleDef[] = [
  {
    slug: "frontend-engineer",
    title: "Frontend Engineer",
    category: "Engineering",
    description:
      "Builds responsive, accessible user interfaces with modern web frameworks and a sharp eye for UX detail.",
    coreSkills: [
      "JavaScript",
      "TypeScript",
      "React",
      "HTML",
      "CSS",
      "Responsive Design",
      "REST APIs",
      "Git",
    ],
    niceToHaveSkills: ["Next.js", "Tailwind CSS", "GraphQL", "Testing", "Figma"],
  },
  {
    slug: "backend-engineer",
    title: "Backend Engineer",
    category: "Engineering",
    description:
      "Designs APIs, services, and data models that power production systems at scale.",
    coreSkills: [
      "Node.js",
      "TypeScript",
      "REST APIs",
      "SQL",
      "PostgreSQL",
      "Git",
      "System Design",
      "Authentication",
    ],
    niceToHaveSkills: ["Redis", "Docker", "Kubernetes", "GraphQL", "Microservices"],
  },
  {
    slug: "fullstack-engineer",
    title: "Full-Stack Engineer",
    category: "Engineering",
    description:
      "Owns features end-to-end across the frontend, backend, and database layers.",
    coreSkills: [
      "JavaScript",
      "TypeScript",
      "React",
      "Node.js",
      "SQL",
      "REST APIs",
      "Git",
      "HTML",
      "CSS",
    ],
    niceToHaveSkills: ["Next.js", "Tailwind CSS", "Docker", "AWS", "Testing"],
  },
  {
    slug: "data-analyst",
    title: "Data Analyst",
    category: "Data",
    description:
      "Translates messy business data into clear dashboards, models, and recommendations.",
    coreSkills: [
      "SQL",
      "Excel",
      "Python",
      "Data Visualization",
      "Statistics",
      "Tableau",
      "Reporting",
    ],
    niceToHaveSkills: ["Power BI", "dbt", "Snowflake", "A/B Testing", "Looker"],
  },
  {
    slug: "data-scientist",
    title: "Data Scientist",
    category: "Data",
    description:
      "Builds predictive models and statistical analyses that influence product and business decisions.",
    coreSkills: [
      "Python",
      "SQL",
      "Statistics",
      "Machine Learning",
      "Pandas",
      "scikit-learn",
      "Data Visualization",
    ],
    niceToHaveSkills: ["TensorFlow", "PyTorch", "MLOps", "Spark", "Bayesian Methods"],
  },
  {
    slug: "ml-engineer",
    title: "Machine Learning Engineer",
    category: "AI / ML",
    description:
      "Ships and operates ML models in production with strong software engineering rigor.",
    coreSkills: [
      "Python",
      "Machine Learning",
      "PyTorch",
      "TensorFlow",
      "MLOps",
      "Docker",
      "REST APIs",
      "Git",
    ],
    niceToHaveSkills: ["Kubernetes", "AWS SageMaker", "LLMs", "Vector Databases", "Airflow"],
  },
  {
    slug: "devops-engineer",
    title: "DevOps Engineer",
    category: "Infrastructure",
    description:
      "Owns the CI/CD, observability, and infrastructure that lets product teams ship safely.",
    coreSkills: [
      "Linux",
      "Docker",
      "Kubernetes",
      "CI/CD",
      "AWS",
      "Terraform",
      "Bash",
      "Monitoring",
    ],
    niceToHaveSkills: ["GCP", "Azure", "Prometheus", "Grafana", "Helm"],
  },
  {
    slug: "product-manager",
    title: "Product Manager",
    category: "Product",
    description:
      "Pairs customer obsession with sharp prioritization to ship products that move the needle.",
    coreSkills: [
      "Product Strategy",
      "User Research",
      "Roadmapping",
      "Analytics",
      "A/B Testing",
      "Stakeholder Management",
      "Prioritization",
    ],
    niceToHaveSkills: ["SQL", "Figma", "OKRs", "Agile", "Jira"],
  },
  {
    slug: "ux-designer",
    title: "UX / Product Designer",
    category: "Design",
    description:
      "Designs intuitive, beautiful product experiences grounded in research and craft.",
    coreSkills: [
      "Figma",
      "User Research",
      "Wireframing",
      "Prototyping",
      "Interaction Design",
      "Visual Design",
      "Accessibility",
    ],
    niceToHaveSkills: ["Design Systems", "HTML", "CSS", "Motion Design", "Usability Testing"],
  },
  {
    slug: "mobile-engineer",
    title: "Mobile Engineer",
    category: "Engineering",
    description:
      "Builds polished native and cross-platform mobile apps used by millions.",
    coreSkills: [
      "React Native",
      "TypeScript",
      "iOS",
      "Android",
      "REST APIs",
      "Git",
      "Mobile UI",
    ],
    niceToHaveSkills: ["Swift", "Kotlin", "Expo", "Firebase", "GraphQL"],
  },
];

export function findRoleBySlug(slug: string): JobRoleDef | undefined {
  return JOB_ROLES.find((r) => r.slug === slug);
}
