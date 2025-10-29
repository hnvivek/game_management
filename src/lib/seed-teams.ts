import { db } from '@/lib/db'

// Team data with realistic stats and information
const teams = [
  {
    name: 'Bengaluru Strikers',
    description: 'Passionate soccer team looking for competitive matches',
    sportId: 'soccer', // Will be replaced with actual ID
    formatId: '5-a-side', // Will be replaced with actual ID
    captainId: 'capt_1', // Will be replaced with actual user ID
    maxPlayers: 10,
    city: 'Bengaluru',
    area: 'Indiranagar',
    isActive: true,
    isPublic: true,
    members: [
      { name: 'Rahul Sharma', phone: '+919876543210', role: 'captain' },
      { name: 'Amit Kumar', phone: '+918765432109', role: 'member' },
      { name: 'Priya Singh', phone: '+917654321098', role: 'member' },
      { name: 'Karthik Reddy', phone: '+916543210987', role: 'member' },
      { name: 'Neha Patel', phone: '+915432109876', role: 'member' },
      { name: 'Vikram Rao', phone: '+914321098765', role: 'member' },
      { name: 'Anjali Nair', phone: '+913210987654', role: 'member' },
      { name: 'Rohit Gupta', phone: '+912109876543', role: 'member' }
    ],
    level: 'Advanced',
    primaryColor: '#EF0107',
    secondaryColor: '#063672'
  },
  {
    name: 'Urban Warriors',
    description: 'Friendly but competitive cricket team',
    sportId: 'cricket',
    formatId: 'tape-ball',
    captainId: 'capt_2',
    maxPlayers: 12,
    city: 'Bengaluru',
    area: 'Koramangala',
    isActive: true,
    isPublic: true,
    members: [
      { name: 'Amit Patel', phone: '+918765432109', role: 'captain' },
      { name: 'Sanjay Kumar', phone: '+917654321098', role: 'member' },
      { name: 'Rajesh Singh', phone: '+916543210987', role: 'member' },
      { name: 'Manoj Reddy', phone: '+915432109876', role: 'member' },
      { name: 'Suresh Babu', phone: '+914321098765', role: 'member' },
      { name: 'Mahesh Kumar', phone: '+913210987654', role: 'member' },
      { name: 'Anand Swamy', phone: '+912109876543', role: 'member' },
      { name: 'Prakash Rao', phone: '+911098765432', role: 'member' },
      { name: 'Ganesh Bhat', phone: '+910987654321', role: 'member' },
      { name: 'Ravi Chandra', phone: '+919876543212', role: 'member' }
    ],
    level: 'Intermediate',
    primaryColor: '#034694',
    secondaryColor: '#FDB913'
  },
  {
    name: 'Tech Titans',
    description: 'Corporate badminton enthusiasts',
    sportId: 'badminton',
    formatId: 'doubles',
    captainId: 'capt_3',
    maxPlayers: 8,
    city: 'Bengaluru',
    area: 'Whitefield',
    isActive: true,
    isPublic: true,
    members: [
      { name: 'Arjun Mehta', phone: '+919876543213', role: 'captain' },
      { name: 'Pooja Sharma', phone: '+918765432214', role: 'member' },
      { name: 'Rohit Verma', phone: '+917654321215', role: 'member' },
      { name: 'Kavita Nair', phone: '+916543210216', role: 'member' },
      { name: 'Sanjay Gupta', phone: '+915432109217', role: 'member' },
      { name: 'Divya Reddy', phone: '+914321098218', role: 'member' }
    ],
    level: 'Beginner',
    primaryColor: '#DC052D',
    secondaryColor: '#FFFFFF'
  },
  {
    name: 'Court Kings',
    description: 'Basketball team with competitive spirit',
    sportId: 'basketball',
    formatId: '5v5',
    captainId: 'capt_4',
    maxPlayers: 10,
    city: 'Bengaluru',
    area: 'HSR Layout',
    isActive: true,
    isPublic: true,
    members: [
      { name: 'Michael Johnson', phone: '+919876543219', role: 'captain' },
      { name: 'David Lee', phone: '+918765432220', role: 'member' },
      { name: 'James Wilson', phone: '+917654321221', role: 'member' },
      { name: 'Chris Brown', phone: '+916543210222', role: 'member' },
      { name: 'Kevin Davis', phone: '+915432109223', role: 'member' },
      { name: 'Steven Miller', phone: '+914321098224', role: 'member' },
      { name: 'Brian Anderson', phone: '+913210987225', role: 'member' },
      { name: 'Jason Taylor', phone: '+912109876226', role: 'member' },
      { name: 'Eric Thomas', phone: '+911098765227', role: 'member' }
    ],
    level: 'Advanced',
    primaryColor: '#6CABDD',
    secondaryColor: '#DC052D'
  },
  {
    name: 'FC Indiranagar',
    description: 'Football club focused on skill development',
    sportId: 'soccer',
    formatId: '7-a-side',
    captainId: 'capt_5',
    maxPlayers: 14,
    city: 'Bengaluru',
    area: 'Indiranagar',
    isActive: true,
    isPublic: true,
    members: [
      { name: 'Carlos Rodriguez', phone: '+919876543228', role: 'captain' },
      { name: 'James Smith', phone: '+918765432229', role: 'member' },
      { name: 'Ryan Garcia', phone: '+917654321230', role: 'member' },
      { name: 'Kevin Park', phone: '+916543210231', role: 'member' },
      { name: 'Lucas Silva', phone: '+915432109232', role: 'member' },
      { name: 'Marco Rossi', phone: '+914321098233', role: 'member' },
      { name: 'Diego Costa', phone: '+913210987234', role: 'member' },
      { name: 'Roberto Martinez', phone: '+912109876235', role: 'member' },
      { name: 'Fernando Torres', phone: '+911098765236', role: 'member' },
      { name: 'Luis Suarez', phone: '+910987654237', role: 'member' },
      { name: 'Andres Iniesta', phone: '+919876543238', role: 'member' }
    ],
    level: 'Professional',
    primaryColor: '#FF0000',
    secondaryColor: '#FFFFFF'
  },
  {
    name: 'Smash Masters',
    description: 'Badminton enthusiasts seeking competitive play',
    sportId: 'badminton',
    formatId: 'singles',
    captainId: 'capt_6',
    maxPlayers: 6,
    city: 'Bengaluru',
    area: 'Jayanagar',
    isActive: true,
    isPublic: true,
    members: [
      { name: 'Saina Nehwal', phone: '+919876543239', role: 'captain' },
      { name: 'PV Sindhu', phone: '+918765432240', role: 'member' },
      { name: 'Kidambi Srikanth', phone: '+917654321241', role: 'member' },
      { name: 'HS Prannoy', phone: '+916543210242', role: 'member' },
      { name: 'Sameer Verma', phone: '+915432109243', role: 'member' }
    ],
    level: 'Professional',
    primaryColor: '#00A650',
    secondaryColor: '#FFFFFF'
  },
  {
    name: 'Turf Warriors',
    description: 'Weekend cricket team for fun and fitness',
    sportId: 'cricket',
    formatId: 'tennis-ball',
    captainId: 'capt_7',
    maxPlayers: 14,
    city: 'Bengaluru',
    area: 'Marathahalli',
    isActive: true,
    isPublic: true,
    members: [
      { name: 'Virat Kohli', phone: '+919876543244', role: 'captain' },
      { name: 'Rohit Sharma', phone: '+918765432245', role: 'member' },
      { name: 'KL Rahul', phone: '+917654321246', role: 'member' },
      { name: 'Rishabh Pant', phone: '+916543210247', role: 'member' },
      { name: 'Hardik Pandya', phone: '+915432109248', role: 'member' },
      { name: 'Jasprit Bumrah', phone: '+914321098249', role: 'member' },
      { name: 'Mohammed Siraj', phone: '+913210987250', role: 'member' },
      { name: 'Shreyas Iyer', phone: '+912109876251', role: 'member' },
      { name: 'Shubman Gill', phone: '+911098765252', role: 'member' },
      { name: 'Ishan Kishan', phone: '+910987654253', role: 'member' },
      { name: 'Suryakumar Yadav', phone: '+919876543254', role: 'member' },
      { name: 'Axar Patel', phone: '+918765432255', role: 'member' }
    ],
    level: 'Intermediate',
    primaryColor: '#FF9933',
    secondaryColor: '#138808'
  },
  {
    name: 'Hoops Nation',
    description: 'Basketball team for all skill levels',
    sportId: 'basketball',
    formatId: '3x3',
    captainId: 'capt_8',
    maxPlayers: 6,
    city: 'Bengaluru',
    area: 'Bellandur',
    isActive: true,
    isPublic: true,
    members: [
      { name: 'Stephen Curry', phone: '+919876543256', role: 'captain' },
      { name: 'LeBron James', phone: '+918765432257', role: 'member' },
      { name: 'Kevin Durant', phone: '+917654321258', role: 'member' },
      { name: 'Giannis Antetokounmpo', phone: '+916543210259', role: 'member' },
      { name: 'Luka Dončić', phone: '+915432109260', role: 'member' }
    ],
    level: 'Advanced',
    primaryColor: '#1D428A',
    secondaryColor: '#C8102E'
  }
]

// Generate recent form for teams
function generateRecentForm(level: string): ('W' | 'D' | 'L')[] {
  const form: ('W' | 'D' | 'L')[] = []

  // Different win rates based on level
  let winRate = 0.4
  switch (level) {
    case 'Professional': winRate = 0.7; break
    case 'Advanced': winRate = 0.55; break
    case 'Intermediate': winRate = 0.4; break
    case 'Beginner': winRate = 0.25; break
  }

  for (let i = 0; i < 5; i++) {
    const rand = Math.random()
    if (rand < winRate) form.push('W')
    else if (rand < winRate + 0.3) form.push('D')
    else form.push('L')
  }

  return form
}

export async function seedTeams() {
  console.log('🌱 Seeding teams...')

  try {
    // Get existing sports, formats, and vendors
    const sports = await db.sportType.findMany()
    const formats = await db.formatType.findMany()
    const vendors = await db.vendor.findMany()

    if (sports.length === 0) {
      throw new Error('No sports found. Please seed sports first.')
    }

    if (formats.length === 0) {
      throw new Error('No formats found. Please seed formats first.')
    }

    if (vendors.length === 0) {
      throw new Error('No vendors found. Please seed vendors first.')
    }

    // Create users for captains
    const captainUsers = []
    for (let i = 1; i <= teams.length; i++) {
      const captainUser = await db.user.upsert({
        where: { email: `captain${i}@example.com` },
        update: {},
        create: {
          email: `captain${i}@example.com`,
          name: teams[i - 1].members[0].name,
          phone: teams[i - 1].members[0].phone,
          role: 'CUSTOMER'
        }
      })
      captainUsers.push(captainUser)
    }

    // Create teams (now global, will be associated with vendors through TeamVendor)
    for (let i = 0; i < teams.length; i++) {
      const teamData = teams[i]

      // Find matching sport and format
      const sport = sports.find(s => s.name === teamData.sportId) || sports[0]
      const format = formats.find(f => f.name === teamData.formatId) || formats[0]

      // Create the team (now global - no vendorId)
      const team = await db.team.create({
        data: {
          name: teamData.name,
          description: teamData.description,
          sportId: sport.id,
          formatId: format.id,
          captainId: captainUsers[i].id,
          maxPlayers: teamData.maxPlayers,
          city: teamData.city,
          area: teamData.area,
          isActive: teamData.isActive,
          isPublic: teamData.isPublic
        }
      })

      // Assign team to play at multiple vendors (teams can play at multiple locations)
      const vendorCount = Math.min(2 + Math.floor(Math.random() * 2), vendors.length) // 2-3 vendors per team
      const selectedVendors = []

      for (let j = 0; j < vendorCount; j++) {
        let vendorIndex = (i + j) % vendors.length
        const vendor = vendors[vendorIndex]

        if (!selectedVendors.find(v => v.id === vendor.id)) {
          selectedVendors.push(vendor)

          await db.teamVendor.create({
            data: {
              teamId: team.id,
              vendorId: vendor.id,
              isPrimary: j === 0, // First vendor is primary
              matchesPlayed: Math.floor(Math.random() * 20), // Random play history
              firstPlayedAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000), // Random within last 90 days
              lastPlayedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random within last 30 days
            }
          })
        }
      }

      // Create team members
      for (const memberData of teamData.members) {
        // Find or create user
        const user = await db.user.upsert({
          where: { email: `${memberData.name.toLowerCase().replace(' ', '.')}@example.com` },
          update: {},
          create: {
            email: `${memberData.name.toLowerCase().replace(' ', '.')}@example.com`,
            name: memberData.name,
            phone: memberData.phone,
            role: 'CUSTOMER'
          }
        })

        // Add user to team
        await db.teamMember.create({
          data: {
            teamId: team.id,
            userId: user.id,
            role: memberData.role
          }
        })
      }

      // Create team statistics (as notes for now)
      const recentForm = generateRecentForm(teamData.level)
      const stats = {
        level: teamData.level,
        recentForm,
        primaryColor: teamData.primaryColor,
        secondaryColor: teamData.secondaryColor,
        wins: recentForm.filter(f => f === 'W').length,
        draws: recentForm.filter(f => f === 'D').length,
        losses: recentForm.filter(f => f === 'L').length,
        played: 5,
        points: recentForm.filter(f => f === 'W').length * 3 + recentForm.filter(f => f === 'D').length
      }

      await db.team.update({
        where: { id: team.id },
        data: {
          description: `${teamData.description}\n\nTeam Stats: ${JSON.stringify(stats)}`
        }
      })

      const vendorNames = selectedVendors.map(v => v.name).join(', ')
      console.log(`✅ Created team: ${team.name} (plays at: ${vendorNames})`)
    }

    console.log('✅ Teams seeding completed successfully!')

  } catch (error) {
    console.error('❌ Error seeding teams:', error)
    throw error
  }
}

// Run if called directly
if (require.main === module) {
  seedTeams()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}