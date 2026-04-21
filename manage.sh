#!/bin/bash
# USE Messenger - All-in-one management script

show_menu() {
    clear
    echo "================================"
    echo "   USE Messenger Manager"
    echo "================================"
    echo ""
    echo "1. Start servers"
    echo "2. Stop servers"
    echo "3. Check status"
    echo "4. Install dependencies"
    echo "5. Build production"
    echo "6. Clean project"
    echo "7. View logs"
    echo "8. Exit"
    echo ""
    echo -n "Select option [1-8]: "
}

while true; do
    show_menu
    read choice

    case $choice in
        1)
            echo ""
            ./start.sh
            read -p "Press Enter to continue..."
            ;;
        2)
            echo ""
            ./stop.sh
            read -p "Press Enter to continue..."
            ;;
        3)
            echo ""
            ./status.sh
            read -p "Press Enter to continue..."
            ;;
        4)
            echo ""
            ./install.sh
            read -p "Press Enter to continue..."
            ;;
        5)
            echo ""
            ./build.sh
            read -p "Press Enter to continue..."
            ;;
        6)
            echo ""
            ./clean.sh
            read -p "Press Enter to continue..."
            ;;
        7)
            echo ""
            echo "1. Backend logs"
            echo "2. Frontend logs"
            echo "3. All logs"
            echo -n "Select: "
            read log_choice
            case $log_choice in
                1) ./logs.sh backend ;;
                2) ./logs.sh frontend ;;
                3) ./logs.sh all ;;
            esac
            read -p "Press Enter to continue..."
            ;;
        8)
            echo ""
            echo "Goodbye!"
            exit 0
            ;;
        *)
            echo ""
            echo "Invalid option!"
            read -p "Press Enter to continue..."
            ;;
    esac
done
