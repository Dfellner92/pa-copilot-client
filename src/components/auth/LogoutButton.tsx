'use client'
import { Button } from "../ui/Button"

export const LogoutButton = () => {
  return (
    <form action="/api/auth/logout" method="post" className="ml-2">
      <Button
        type="submit"
        className="mr-2"
        aria-label="Logout"
      >
        Logout
      </Button>
    </form>
  )
}
