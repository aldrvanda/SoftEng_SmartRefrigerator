import Image from "next/image";
import { getCollection } from "../lib/db";

export default async function Home() {

  async function SaveUser(formData: FormData){
    "use server";

    const username = formData.get("username")
    const email = formData.get("email")
    const password = formData.get("password")
    const userCollection = await getCollection('user')

    if(userCollection){
      await userCollection.insertOne({
        username: username,
        email: email,
        password: password,
        userCreatedDate: new Date()
      });

      console.log(userCollection);
    }
  }
  
  return (
    <div className="max-w-lg mx-auto p-4">
      <h2 className="text-2x1 font-bold mb-4">
        Sign Up
      </h2>
      <form action={SaveUser} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Username</label>
          <input type="text" name="username" className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="Enter your Username" required />
        </div>
        <div>
          <label>Email</label>
          <input type="email" name="email" className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="Enter your Username" required placeholder="Enter your Email" />
        </div>
        <div>
          <label>Password</label>
          <input type="password" name="password" className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="Enter your Username" required placeholder="Enter your password" />
        </div>
        <button type="submit" className="w-full py-2 px-4 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-300">Sign Up</button>
      </form>
    </div>
  );
}
