"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Search, Users, Building, X } from "lucide-react"
import { getDevicesByDepartment, getDevicesByAssignedUser } from "@/lib/device-actions"
import type { Device, User } from "@/lib/types"

interface EmployeeFilterProps {
  onFilterChange: (devices: Device[]) => void
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
}

// Mock departments and users for the demo
const departments = [
  "All Departments",
  "IT",
  "Engineering",
  "Sales",
  "Marketing",
  "Human Resources",
  "Finance",
  "Operations",
]

const users: User[] = [
  { id: "user1", name: "Demo User", email: "user1@example.com" },
  { id: "user2", name: "Jane Smith", email: "jane@example.com" },
  { id: "user3", name: "John Doe", email: "john@example.com" },
  { id: "user4", name: "Alice Johnson", email: "alice@example.com" },
  { id: "user5", name: "Bob Williams", email: "bob@example.com" },
]

export default function EmployeeFilter({ onFilterChange, isLoading, setIsLoading }: EmployeeFilterProps) {
  const [selectedDepartment, setSelectedDepartment] = useState<string>("All Departments")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [selectedUsers, setSelectedUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>(users)

  useEffect(() => {
    // Filter users based on search query
    if (searchQuery) {
      setFilteredUsers(
        users.filter(
          (user) =>
            user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase()),
        ),
      )
    } else {
      setFilteredUsers(users)
    }
  }, [searchQuery])

  const handleDepartmentChange = async (value: string) => {
    setSelectedDepartment(value)
    setIsLoading(true)

    try {
      if (value === "All Departments") {
        // Reset filters
        onFilterChange([])
      } else {
        const devices = await getDevicesByDepartment(value)
        onFilterChange(devices)
      }
    } catch (error) {
      console.error("Failed to filter by department:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUserSelect = async (user: User) => {
    if (!selectedUsers.some((u) => u.id === user.id)) {
      const newSelectedUsers = [...selectedUsers, user]
      setSelectedUsers(newSelectedUsers)
      setIsLoading(true)

      try {
        // If we have multiple users selected, we need to fetch devices for each and combine
        const allDevices: Device[] = []
        for (const selectedUser of newSelectedUsers) {
          const devices = await getDevicesByAssignedUser(selectedUser.id)
          // Add only unique devices
          devices.forEach((device) => {
            if (!allDevices.some((d) => d.id === device.id)) {
              allDevices.push(device)
            }
          })
        }
        onFilterChange(allDevices)
      } catch (error) {
        console.error("Failed to filter by user:", error)
      } finally {
        setIsLoading(false)
      }
    }
  }

  const removeUserFilter = async (userId: string) => {
    const newSelectedUsers = selectedUsers.filter((u) => u.id !== userId)
    setSelectedUsers(newSelectedUsers)
    setIsLoading(true)

    try {
      if (newSelectedUsers.length === 0) {
        // Reset filters if no users selected
        onFilterChange([])
      } else {
        // Reapply filters with remaining users
        const allDevices: Device[] = []
        for (const selectedUser of newSelectedUsers) {
          const devices = await getDevicesByAssignedUser(selectedUser.id)
          devices.forEach((device) => {
            if (!allDevices.some((d) => d.id === device.id)) {
              allDevices.push(device)
            }
          })
        }
        onFilterChange(allDevices)
      }
    } catch (error) {
      console.error("Failed to update user filters:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const clearAllFilters = () => {
    setSelectedDepartment("All Departments")
    setSelectedUsers([])
    setSearchQuery("")
    onFilterChange([])
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filter Devices</CardTitle>
        <CardDescription>Filter devices by department, employee, or search</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Department</span>
            </div>
            <Select value={selectedDepartment} onValueChange={handleDepartmentChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Employee</span>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search employees..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {searchQuery && filteredUsers.length > 0 && (
              <div className="mt-1 border rounded-md max-h-48 overflow-y-auto">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="p-2 hover:bg-muted cursor-pointer flex items-center justify-between"
                    onClick={() => handleUserSelect(user)}
                  >
                    <div>
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleUserSelect(user)
                      }}
                    >
                      +
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {selectedUsers.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedUsers.map((user) => (
                  <Badge key={user.id} variant="secondary" className="flex items-center gap-1">
                    {user.name}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 ml-1"
                      onClick={() => removeUserFilter(user.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {(selectedDepartment !== "All Departments" || selectedUsers.length > 0) && (
            <Button variant="outline" size="sm" className="w-full mt-2" onClick={clearAllFilters}>
              Clear All Filters
            </Button>
          )}

          {isLoading && (
            <div className="flex justify-center py-2">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

