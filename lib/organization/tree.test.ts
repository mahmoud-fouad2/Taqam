import { describe, expect, it } from "vitest";

import { buildDepartmentTree, buildEmployeeOrgForest } from "@/lib/organization/tree";

describe("buildEmployeeOrgForest", () => {
  it("builds a nested reporting structure from manager relationships", () => {
    const forest = buildEmployeeOrgForest([
      {
        id: "ceo",
        employeeNumber: "000001",
        firstName: "Chief",
        lastName: "Executive",
        status: "ACTIVE"
      },
      {
        id: "mgr",
        employeeNumber: "000002",
        firstName: "Team",
        lastName: "Lead",
        managerId: "ceo",
        status: "ACTIVE"
      },
      {
        id: "ic",
        employeeNumber: "000003",
        firstName: "Individual",
        lastName: "Contributor",
        managerId: "mgr",
        status: "ACTIVE"
      }
    ]);

    expect(forest).toHaveLength(1);
    expect(forest[0]?.id).toBe("ceo");
    expect(forest[0]?.directReports[0]?.id).toBe("mgr");
    expect(forest[0]?.directReports[0]?.directReports[0]?.id).toBe("ic");
  });

  it("surfaces orphaned manager links as detached roots", () => {
    const forest = buildEmployeeOrgForest([
      {
        id: "emp-1",
        employeeNumber: "000010",
        firstName: "Detached",
        lastName: "Employee",
        managerId: "missing-manager",
        status: "ACTIVE"
      }
    ]);

    expect(forest).toHaveLength(1);
    expect(forest[0]?.id).toBe("emp-1");
    expect(forest[0]?.hasHierarchyIssue).toBe(true);
  });

  it("guards against manager cycles without infinite recursion", () => {
    const forest = buildEmployeeOrgForest([
      {
        id: "a",
        employeeNumber: "000011",
        firstName: "A",
        lastName: "Node",
        managerId: "b",
        status: "ACTIVE"
      },
      {
        id: "b",
        employeeNumber: "000012",
        firstName: "B",
        lastName: "Node",
        managerId: "a",
        status: "ACTIVE"
      }
    ]);

    expect(forest.length).toBeGreaterThan(0);
    expect(forest[0]?.hasHierarchyIssue).toBe(true);
    expect(forest[0]?.directReports.length).toBeLessThanOrEqual(1);
  });
});

describe("buildDepartmentTree", () => {
  it("builds a nested department hierarchy and descendant counts", () => {
    const tree = buildDepartmentTree([
      {
        id: "hq",
        name: "Head Office",
        employeesCount: 2
      },
      {
        id: "ops",
        name: "Operations",
        parentId: "hq",
        employeesCount: 3
      },
      {
        id: "field",
        name: "Field Team",
        parentId: "ops",
        employeesCount: 5
      }
    ]);

    expect(tree).toHaveLength(1);
    expect(tree[0]?.children[0]?.id).toBe("ops");
    expect(tree[0]?.descendantEmployeeCount).toBe(10);
  });

  it("keeps departments with invalid parent links as safe roots", () => {
    const tree = buildDepartmentTree([
      {
        id: "floating",
        name: "Floating",
        parentId: "missing",
        employeesCount: 1
      }
    ]);

    expect(tree).toHaveLength(1);
    expect(tree[0]?.id).toBe("floating");
    expect(tree[0]?.hasHierarchyIssue).toBe(true);
  });
});