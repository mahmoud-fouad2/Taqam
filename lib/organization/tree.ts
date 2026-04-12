export interface OrgPersonSummary {
  id: string;
  employeeNumber?: string | null;
  firstName: string;
  firstNameAr?: string | null;
  lastName: string;
  lastNameAr?: string | null;
  email?: string | null;
  avatar?: string | null;
}

export interface OrgEmployeeRecord extends OrgPersonSummary {
  managerId?: string | null;
  status: string;
  department?: {
    id: string;
    name: string;
    nameAr?: string | null;
  } | null;
  jobTitle?: {
    id?: string;
    name: string;
    nameAr?: string | null;
  } | null;
  branch?: {
    id: string;
    name: string;
    nameAr?: string | null;
  } | null;
}

export interface OrgEmployeeNode extends OrgEmployeeRecord {
  directReports: OrgEmployeeNode[];
  directReportsCount: number;
  hasHierarchyIssue?: boolean;
}

export interface OrgDepartmentRecord {
  id: string;
  name: string;
  nameAr?: string | null;
  code?: string | null;
  parentId?: string | null;
  isActive?: boolean;
  employeesCount: number;
  manager?: OrgPersonSummary | null;
}

export interface OrgDepartmentNode extends OrgDepartmentRecord {
  children: OrgDepartmentNode[];
  descendantEmployeeCount: number;
  hasHierarchyIssue?: boolean;
}

type EmployeeMutableNode = OrgEmployeeRecord & { childIds: string[] };
type DepartmentMutableNode = OrgDepartmentRecord & { childIds: string[] };

function fullName(person: OrgPersonSummary, locale: "ar" | "en" = "ar") {
  if (locale === "ar" && person.firstNameAr && person.lastNameAr) {
    return `${person.firstNameAr} ${person.lastNameAr}`;
  }

  return `${person.firstName} ${person.lastName}`;
}

export function buildEmployeeOrgForest(employees: OrgEmployeeRecord[]): OrgEmployeeNode[] {
  const nodeMap = new Map<string, EmployeeMutableNode>();

  for (const employee of employees) {
    nodeMap.set(employee.id, {
      ...employee,
      childIds: []
    });
  }

  const rootIds = new Set<string>();
  const detachedIds = new Set<string>();

  for (const employee of employees) {
    const managerId = employee.managerId ?? undefined;

    if (!managerId || managerId === employee.id) {
      rootIds.add(employee.id);
      if (managerId === employee.id) {
        detachedIds.add(employee.id);
      }
      continue;
    }

    const manager = nodeMap.get(managerId);
    if (!manager) {
      rootIds.add(employee.id);
      detachedIds.add(employee.id);
      continue;
    }

    manager.childIds.push(employee.id);
  }

  const forest: OrgEmployeeNode[] = [];
  const seen = new Set<string>();

  const visit = (id: string, path: Set<string>): OrgEmployeeNode | null => {
    const node = nodeMap.get(id);
    if (!node) return null;

    const inCycle = path.has(id);
    const nextPath = new Set(path);
    nextPath.add(id);

    const directReports: OrgEmployeeNode[] = [];
    let hasHierarchyIssue = detachedIds.has(id) || inCycle;

    for (const childId of node.childIds) {
      if (nextPath.has(childId)) {
        hasHierarchyIssue = true;
        continue;
      }

      const childNode = visit(childId, nextPath);
      if (childNode) {
        directReports.push(childNode);
      }
    }

    seen.add(id);

    return {
      id: node.id,
      employeeNumber: node.employeeNumber ?? null,
      firstName: node.firstName,
      firstNameAr: node.firstNameAr ?? null,
      lastName: node.lastName,
      lastNameAr: node.lastNameAr ?? null,
      email: node.email ?? null,
      avatar: node.avatar ?? null,
      managerId: node.managerId ?? null,
      status: node.status,
      department: node.department ?? null,
      jobTitle: node.jobTitle ?? null,
      branch: node.branch ?? null,
      directReports,
      directReportsCount: directReports.length,
      ...(hasHierarchyIssue ? { hasHierarchyIssue: true } : {})
    };
  };

  for (const rootId of rootIds) {
    if (seen.has(rootId)) continue;
    const node = visit(rootId, new Set<string>());
    if (node) forest.push(node);
  }

  for (const employee of employees) {
    if (seen.has(employee.id)) continue;
    detachedIds.add(employee.id);
    const node = visit(employee.id, new Set<string>());
    if (node) forest.push({ ...node, hasHierarchyIssue: true });
  }

  forest.sort((left, right) => fullName(left).localeCompare(fullName(right), "ar"));
  return forest;
}

export function buildDepartmentTree(departments: OrgDepartmentRecord[]): OrgDepartmentNode[] {
  const nodeMap = new Map<string, DepartmentMutableNode>();

  for (const department of departments) {
    nodeMap.set(department.id, {
      ...department,
      childIds: []
    });
  }

  const rootIds = new Set<string>();
  const detachedIds = new Set<string>();

  for (const department of departments) {
    const parentId = department.parentId ?? undefined;

    if (!parentId || parentId === department.id) {
      rootIds.add(department.id);
      if (parentId === department.id) {
        detachedIds.add(department.id);
      }
      continue;
    }

    const parent = nodeMap.get(parentId);
    if (!parent) {
      rootIds.add(department.id);
      detachedIds.add(department.id);
      continue;
    }

    parent.childIds.push(department.id);
  }

  const seen = new Set<string>();

  const visit = (id: string, path: Set<string>): OrgDepartmentNode | null => {
    const node = nodeMap.get(id);
    if (!node) return null;

    const nextPath = new Set(path);
    nextPath.add(id);
    let hasHierarchyIssue = detachedIds.has(id);
    const children: OrgDepartmentNode[] = [];

    for (const childId of node.childIds) {
      if (nextPath.has(childId)) {
        hasHierarchyIssue = true;
        continue;
      }

      const child = visit(childId, nextPath);
      if (child) {
        if (child.hasHierarchyIssue) hasHierarchyIssue = true;
        children.push(child);
      }
    }

    seen.add(id);

    const descendantEmployeeCount = children.reduce(
      (sum, child) => sum + child.descendantEmployeeCount,
      node.employeesCount
    );

    return {
      id: node.id,
      name: node.name,
      nameAr: node.nameAr ?? null,
      code: node.code ?? null,
      parentId: node.parentId ?? null,
      isActive: node.isActive ?? true,
      employeesCount: node.employeesCount,
      manager: node.manager ?? null,
      children,
      descendantEmployeeCount,
      ...(hasHierarchyIssue ? { hasHierarchyIssue: true } : {})
    };
  };

  const tree: OrgDepartmentNode[] = [];
  for (const rootId of rootIds) {
    if (seen.has(rootId)) continue;
    const node = visit(rootId, new Set<string>());
    if (node) tree.push(node);
  }

  for (const department of departments) {
    if (seen.has(department.id)) continue;
    const node = visit(department.id, new Set<string>());
    if (node) tree.push({ ...node, hasHierarchyIssue: true });
  }

  tree.sort((left, right) => (left.nameAr || left.name).localeCompare(right.nameAr || right.name, "ar"));
  return tree;
}