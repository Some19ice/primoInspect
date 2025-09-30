#!/bin/bash
echo "🌱 PrimoInspect Quick Demo Setup"
echo "================================"
echo
echo "Installing dependencies..."
npm install
echo
echo "Seeding demo data..."
npm run seed:demo-data
echo
echo "🎉 Demo setup complete!"
echo
echo "Demo Accounts:"
echo "  Executive: sarah.chen@primoinspect.com / DemoExec2025!"
echo "  Manager: jennifer.park@primoinspect.com / DemoManager2025!"
echo "  Inspector: james.martinez@primoinspect.com / DemoInspector2025!"
echo
echo "Start the application:"
echo "  npm run dev"

