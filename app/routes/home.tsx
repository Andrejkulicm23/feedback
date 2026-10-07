import type { Route } from "./+types/home";
import Feedback from "../components/Feedback";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Home() {
  return <Feedback />;
}
