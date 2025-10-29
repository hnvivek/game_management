'use client'

import { useState } from 'react'
import { Search, MapPin, Users, Trophy, BarChart3 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Navbar from '@/components/navbar'

// Team data
const teams = [
  {
    id: 1,
    name: 'Arsenal FC',
    logo: 'https://1000logos.net/wp-content/uploads/2016/10/Arsenal-Logo.png',
    primaryColor: '#EF0107',
    secondaryColor: '#063672',
    members: ['Alex Johnson', 'Sam Wilson', 'Mike Chen', 'David Lee'],
    level: 'Intermediate',
    city: 'Bengaluru',
    recentForm: ['W', 'W', 'D', 'W', 'L']
  },
  {
    id: 2,
    name: 'Manchester United',
    logo: 'https://1000logos.net/wp-content/uploads/2017/03/Manchester-United-Logo.png',
    primaryColor: '#DA020E',
    secondaryColor: '#FBE122',
    members: ['Sarah Miller', 'Tom Brown', 'Chris Taylor', 'Jake Davis'],
    level: 'Beginner',
    city: 'Bengaluru',
    recentForm: ['L', 'D', 'W', 'L', 'D']
  },
  {
    id: 3,
    name: 'Liverpool FC',
    logo: 'https://1000logos.net/wp-content/uploads/2017/04/Liverpool-Logo.png',
    primaryColor: '#C8102E',
    secondaryColor: '#00B2A9',
    members: ['Carlos Rodriguez', 'James Smith', 'Ryan Garcia', 'Kevin Park'],
    level: 'Advanced',
    city: 'Bengaluru',
    recentForm: ['W', 'W', 'W', 'D', 'W']
  },
  {
    id: 4,
    name: 'Chelsea FC',
    logo: 'https://1000logos.net/wp-content/uploads/2016/11/Chelsea-Logo.png',
    primaryColor: '#034694',
    secondaryColor: '#DBA732',
    members: ['Emma Wilson', 'Oliver Brown', 'Sophie Taylor', 'Lucas Davis'],
    level: 'Intermediate',
    city: 'Bengaluru',
    recentForm: ['D', 'W', 'L', 'W', 'W']
  },
  {
    id: 5,
    name: 'Bayern Munich',
    logo: 'https://1000logos.net/wp-content/uploads/2018/05/Bayern-Munchen-Logo.png',
    primaryColor: '#DC052D',
    secondaryColor: '#FFFFFF',
    members: ['Hans Mueller', 'Klaus Schmidt', 'Erik Weber', 'Karl Fischer'],
    level: 'Advanced',
    city: 'Bengaluru',
    recentForm: ['W', 'W', 'W', 'W', 'D']
  }
]

export default function TeamsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [levelFilter, setLevelFilter] = useState('all')

  const filteredTeams = teams.filter(team => {
    const matchesSearch = team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         team.city.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesLevel = levelFilter === 'all' || team.level.toLowerCase() === levelFilter.toLowerCase()
    return matchesSearch && matchesLevel
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Teams</h1>
          <p className="text-gray-600">Discover and connect with local teams in Bengaluru</p>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search teams..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Teams Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTeams.map((team, index) => (
            <Card key={team.id} className="hover:shadow-lg transition-all">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Team Logo */}
                    <div className="relative">
                      <div className="w-14 h-14 bg-gray-50 rounded-xl flex items-center justify-center border">
                        <img
                          src={team.logo}
                          alt={team.name}
                          className="w-10 h-10 object-contain"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                            const fallback = document.createElement('div')
                            fallback.className = 'text-lg font-bold text-gray-600'
                            fallback.textContent = team.name.split(' ').map(n => n[0]).join('')
                            if (e.currentTarget.parentElement) {
                              e.currentTarget.parentElement.appendChild(fallback)
                            }
                          }}
                        />
                      </div>
                      <div className={`absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm ${
                        index === 0 ? 'bg-amber-500' :
                        index === 1 ? 'bg-gray-400' :
                        index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                      }`}>
                        {index + 1}
                      </div>
                    </div>

                    {/* Team Info */}
                    <div>
                      <CardTitle className="text-base font-semibold">{team.name}</CardTitle>
                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                        <MapPin className="h-3 w-3" />
                        <span>{team.city}</span>
                      </div>
                    </div>
                  </div>

                  {/* Level Badge */}
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                    {team.level}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Performance Metrics */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-emerald-50 rounded p-2 border border-emerald-200">
                    <div className="text-base font-bold text-emerald-700">
                      {team.recentForm.filter(f => f === 'W').length}
                    </div>
                    <div className="text-xs text-emerald-600">Wins</div>
                  </div>
                  <div className="bg-amber-50 rounded p-2 border border-amber-200">
                    <div className="text-base font-bold text-amber-700">
                      {team.recentForm.filter(f => f === 'D').length}
                    </div>
                    <div className="text-xs text-amber-600">Draws</div>
                  </div>
                  <div className="bg-red-50 rounded p-2 border border-red-200">
                    <div className="text-base font-bold text-red-700">
                      {team.recentForm.filter(f => f === 'L').length}
                    </div>
                    <div className="text-xs text-red-600">Losses</div>
                  </div>
                </div>

                {/* Recent Form */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-700">Recent Form</span>
                  <div className="flex gap-1">
                    {team.recentForm.map((result, idx) => (
                      <div key={idx} className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${
                        result === 'W' ? 'bg-emerald-500 text-white' :
                        result === 'D' ? 'bg-amber-500 text-white' : 'bg-red-500 text-white'
                      }`}>
                        {result}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Team Members */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-700">Squad</span>
                  <div className="flex -space-x-2">
                    {team.members.slice(0, 4).map((member, idx) => (
                      <Avatar key={idx} className="h-7 w-7 border-2 border-white">
                        <AvatarFallback className="text-xs font-semibold bg-gray-100 text-gray-700">
                          {member.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Link href="/team-wall" className="block">
                    <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-xs h-8">
                      <Users className="h-3 w-3 mr-1" />
                      View Team
                    </Button>
                  </Link>
                  <Button variant="outline" size="sm" className="w-full text-xs h-8">
                    <Trophy className="h-3 w-3 mr-1" />
                    Challenge
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredTeams.length === 0 && (
          <div className="text-center py-16">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No teams found</h3>
            <p className="text-gray-600">Try adjusting your search or filters</p>
          </div>
        )}
      </main>
    </div>
  )
}
