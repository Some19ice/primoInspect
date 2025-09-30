'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Users, TrendingUp, Clock, AlertTriangle, CheckCircle, UserPlus } from 'lucide-react'

interface TeamMember {
  id: string
  name: string
  role: string
  workload: number
  efficiency: number
  assignedInspections: number
  completedThisWeek: number
  overdueCount: number
  status: 'available' | 'busy' | 'offline'
}

interface TeamManagementProps {
  teamMembers: TeamMember[]
  onAssignInspection: (memberId: string) => void
  onViewMember: (memberId: string) => void
}

export function TeamManagementDashboard({ teamMembers, onAssignInspection, onViewMember }: TeamManagementProps) {
  const workloadData = teamMembers.map(member => ({
    name: member.name.split(' ')[0],
    workload: member.workload,
    efficiency: member.efficiency
  }))

  const statusDistribution = [
    { name: 'Available', value: teamMembers.filter(m => m.status === 'available').length, color: '#10b981' },
    { name: 'Busy', value: teamMembers.filter(m => m.status === 'busy').length, color: '#f59e0b' },
    { name: 'Offline', value: teamMembers.filter(m => m.status === 'offline').length, color: '#ef4444' }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800'
      case 'busy': return 'bg-yellow-100 text-yellow-800'
      case 'offline': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getWorkloadColor = (workload: number) => {
    if (workload >= 90) return 'text-red-600'
    if (workload >= 70) return 'text-yellow-600'
    return 'text-green-600'
  }

  return (
    <div className="space-y-6">
      {/* Team Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Team</span>
              <Users className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold">{teamMembers.length}</div>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Available</span>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-green-600">
              {teamMembers.filter(m => m.status === 'available').length}
            </div>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Overloaded</span>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </div>
            <div className="text-2xl font-bold text-red-600">
              {teamMembers.filter(m => m.workload >= 90).length}
            </div>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Avg Efficiency</span>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold">
              {Math.round(teamMembers.reduce((sum, m) => sum + m.efficiency, 0) / teamMembers.length)}%
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Team Workload</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={workloadData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="workload" fill="#3b82f6" />
                <Bar dataKey="efficiency" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Team Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Team Members List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Team Members</CardTitle>
            <Button size="sm">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Member
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {teamMembers.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{member.name}</h4>
                      <Badge className={getStatusColor(member.status)}>
                        {member.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{member.role}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-sm text-gray-600">Workload</div>
                    <div className={`font-medium ${getWorkloadColor(member.workload)}`}>
                      {member.workload}%
                    </div>
                    <Progress value={member.workload} className="w-16 h-2 mt-1" />
                  </div>
                  
                  <div className="text-center">
                    <div className="text-sm text-gray-600">Assigned</div>
                    <div className="font-medium">{member.assignedInspections}</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-sm text-gray-600">Completed</div>
                    <div className="font-medium text-green-600">{member.completedThisWeek}</div>
                  </div>
                  
                  {member.overdueCount > 0 && (
                    <div className="text-center">
                      <div className="text-sm text-gray-600">Overdue</div>
                      <div className="font-medium text-red-600">{member.overdueCount}</div>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => onViewMember(member.id)}
                    >
                      View
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => onAssignInspection(member.id)}
                      disabled={member.workload >= 90}
                    >
                      Assign
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
