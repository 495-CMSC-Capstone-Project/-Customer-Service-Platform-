import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ConversationSort,
  ConversationStatusFilter,
  type ConversationStatusCounts,
} from "../../utils/conversationFilters";
import { ConversationFilters } from "./ConversationFilters";

afterEach(() => {
  cleanup();
});

const counts: ConversationStatusCounts = {
  ALL: 5,
  ACTIVE: 1,
  ESCALATED: 1,
  RESOLVED: 2,
  CLOSED: 1,
};

function renderFilters(
  overrides: Partial<React.ComponentProps<typeof ConversationFilters>> = {},
) {
  const props: React.ComponentProps<typeof ConversationFilters> = {
    query: "",
    status: ConversationStatusFilter.ALL,
    sort: ConversationSort.NEWEST,
    counts,
    resultCount: 5,
    onQueryChange: vi.fn(),
    onStatusChange: vi.fn(),
    onSortChange: vi.fn(),
    onClear: vi.fn(),
    ...overrides,
  };

  render(<ConversationFilters {...props} />);
  return props;
}

describe("ConversationFilters", () => {
  it("shows status totals and the current result count", () => {
    renderFilters({ resultCount: 2 });

    expect(
      screen.getByRole("button", { name: "Resolved, 2 conversations" }),
    ).toBeTruthy();
    expect(screen.getByText("2 conversations")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Clear filters" })).toBeNull();
  });

  it("reports search, status, and sort changes", () => {
    const props = renderFilters();

    fireEvent.change(screen.getByRole("searchbox", { name: "Search conversations" }), {
      target: { value: "billing" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Escalated, 1 conversation" }),
    );
    fireEvent.change(screen.getByRole("combobox", { name: "Sort by" }), {
      target: { value: ConversationSort.OLDEST },
    });

    expect(props.onQueryChange).toHaveBeenCalledWith("billing");
    expect(props.onStatusChange).toHaveBeenCalledWith(
      ConversationStatusFilter.ESCALATED,
    );
    expect(props.onSortChange).toHaveBeenCalledWith(ConversationSort.OLDEST);
  });

  it("lets the user clear an active filter", () => {
    const onClear = vi.fn();
    renderFilters({ query: "invoice", resultCount: 1, onClear });

    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));

    expect(onClear).toHaveBeenCalledOnce();
  });
});
