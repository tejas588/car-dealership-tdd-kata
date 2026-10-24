import { afterEach, beforeEach, expect, test, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import App from "./App.jsx";
import VehicleCard from "./components/VehicleCard.jsx";

vi.mock("./services/api.js", () => ({
  api: { post: vi.fn(), get: vi.fn(), delete: vi.fn(), put: vi.fn() },
  errorMessage: () => "Request failed",
}));
import { api } from "./services/api.js";

afterEach(cleanup);

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  window.history.pushState({}, "", "/login");
  api.get.mockResolvedValue({
    data: { data: [], pagination: { total: 0, limit: 9 } },
  });
});

test("logs in and loads the vehicle dashboard", async () => {
  api.post.mockResolvedValue({
    data: {
      token: "test-token",
      user: { id: "1", name: "Asha", email: "asha@example.test", role: "USER" },
    },
  });
  render(<App />);
  fireEvent.change(screen.getByLabelText("Email address"), {
    target: { value: "asha@example.test" },
  });
  fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: "password123" },
  });
  fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
  await waitFor(() =>
    expect(screen.getByText(/Explore the lineup/)).toBeInTheDocument(),
  );
  expect(api.post).toHaveBeenCalledWith("/auth/login", {
    email: "asha@example.test",
    password: "password123",
  });
  expect(api.get).toHaveBeenCalled();
});

test("disables purchase for a sold-out vehicle", () => {
  render(
    <VehicleCard
      vehicle={{
        id: "1",
        make: "Honda",
        model: "City",
        category: "Sedan",
        price: "100.00",
        quantityInStock: 0,
      }}
      onPurchase={() => {}}
    />,
  );
  expect(screen.getByRole("button", { name: /Purchase/i })).toBeDisabled();
  expect(screen.getByText("Sold out")).toBeInTheDocument();
});

test("opens admin vehicle creation form", async () => {
  localStorage.setItem("torque_token", "test-token");
  localStorage.setItem(
    "torque_user",
    JSON.stringify({ name: "Admin", role: "ADMIN" }),
  );
  window.history.pushState({}, "", "/admin");
  render(<App />);
  await waitFor(() =>
    expect(screen.getByText(/Inventory overview/)).toBeInTheDocument(),
  );
  fireEvent.click(screen.getByRole("button", { name: /Add vehicle/i }));
  expect(
    screen.getByRole("dialog", { name: "create vehicle" }),
  ).toBeInTheDocument();
});
