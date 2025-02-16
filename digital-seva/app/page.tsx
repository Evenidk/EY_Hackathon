// digital-seva\app\page.tsx
import Image from "next/image";
import CitizenServices from "./Hero";
import Dashboard from "./Middle";
import GovtServicesPlatform from "./Lower";
import SchemeFinder from "./components/SchemeFinder"; // Import the SchemeFinder component

export default function Home() {
  return (
    <div>
      <CitizenServices />
    </div>
  );
}
