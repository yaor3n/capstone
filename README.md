# Steps on setting up
1. Cloning this repository 
```
git clone https://github.com/theducksinapu/capstone && cd capstone
```
3. [Create a new database](https://database.new/)
4. Go to [step 3](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs) copy your credentials 
5. change the file which you cloned earlier from `env.example` to `env.local`
6. Run `npm install` to install dependencies
7. Run `npm run dev` to start the development env
8. Open the sql editor on supabase
9. Run both of the sql file content from this sql folder in this repository inside the sql runner
10. Turn off email confirmation inside supabase settings -> Authentication > Sign In / Up > Auth Providers > Email > Turn off Confirm Email & Turn off secure email change
11. Create an account on http://localhost:3000/sign-up
12. Verify the user has been created in supabase dashboard -> Table Editor > users
