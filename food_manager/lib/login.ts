"use server";

import { getCollection } from "./db";
import { redirect } from "next/navigation";

export async function Login(formData: FormData) {
    const email = formData.get('email');
    const password = formData.get("password");

    if(!email || !password){
        return(message: "Please fill in all fields");
    }

    try{
        const userCollection = await getCollection('user');\

        if(!userCollection){
            return(message: "Connection to DB Failed)";
        }

        const user = await userCollection.findOne({email: email});
    }
}