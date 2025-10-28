#!/bin/bash

echo "🌱 Seeding database with turf data..."

# Seed the database
curl -X POST http://localhost:3000/api/seed

echo "✅ Database seeded successfully!"
echo ""
echo "📊 Seeded data includes:"
echo "   • Soccer turfs (11, 8, 6 a side)"
echo "   • Ultimate Frisbee courts"
echo "   • Box cricket grounds"
echo "   • 30 days of availability"
echo "   • Pricing for all turf types"
echo ""
echo "🏃‍♂️ You can now test the turf booking system!"
echo "   1. Open http://localhost:3000"
echo "   2. Click 'Create Match'"
echo "   3. Select sport, date, time, and duration"
echo "   4. Choose from available turfs"
echo "   5. Book and create your match!"