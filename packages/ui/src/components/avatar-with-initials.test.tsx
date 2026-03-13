import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { AvatarWithInitials, getInitials } from "./avatar-with-initials.js";

afterEach(cleanup);

describe("getInitials", () => {
  it("extracts two initials from a full name", () => {
    expect(getInitials("Daniel Schmidt")).toBe("DS");
  });

  it("handles single name", () => {
    expect(getInitials("Daniel")).toBe("D");
  });

  it("truncates to 2 chars for 3+ word names", () => {
    expect(getInitials("John Paul Jones")).toBe("JP");
  });
});

describe("AvatarWithInitials", () => {
  it("renders initials when no src provided", () => {
    render(<AvatarWithInitials name="Daniel Schmidt" />);
    expect(screen.getByText("DS")).toBeTruthy();
  });

  it("renders image when src is provided", () => {
    render(
      <AvatarWithInitials
        name="Daniel Schmidt"
        src="https://example.com/avatar.jpg"
      />,
    );
    const img = screen.getByAltText("Daniel Schmidt") as HTMLImageElement;
    expect(img.src).toBe("https://example.com/avatar.jpg");
  });

  it("renders initials when src is null", () => {
    render(<AvatarWithInitials name="Test User" src={null} />);
    expect(screen.getByText("TU")).toBeTruthy();
  });
});
