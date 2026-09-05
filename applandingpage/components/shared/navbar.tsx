import Link from "next/dist/client/link";
import React from "react";

const Navbar = () => {
  return (
    <div className="bg-transparent relative z-50 w-full  container mx-auto  py-4 px-6">
      <div className="flex items-center justify-between">
        <div className="">
          <img src="" alt="" className="h-16 w-16" />
        </div>
        <div className="flex items-center gap-6">
          <ul className="flex items-center gap-6">
            <li>
              <Link href="#">Home</Link>
            </li>
            <li>
              <Link href="#">Feacture</Link>
            </li>
            <li>
              <Link href="#">Screenshots</Link>
            </li>
            <li>
              <Link href="#">Faqs</Link>
            </li>
            <li>
              <Link href="#">Contact</Link>
            </li>
          </ul>
        </div>
        <div className="">
          <button className="">Download App</button>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
