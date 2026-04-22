#!/usr/bin/env python3
import paramiko
import sys

server = "138.124.26.50"
username = "root"
password = "TY0muYW1o5Kv"

try:
    # Читаем публичный ключ
    with open('/c/Users/0kpunk/.ssh/id_rsa.pub', 'r') as f:
        public_key = f.read().strip()

    print(f"Подключение к {server}...")

    # Подключаемся к серверу
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(server, username=username, password=password, timeout=10)

    print("Подключение успешно!")

    # Создаем директорию .ssh если её нет
    stdin, stdout, stderr = client.exec_command('mkdir -p ~/.ssh && chmod 700 ~/.ssh')
    stdout.channel.recv_exit_status()

    # Добавляем публичный ключ
    command = f'echo "{public_key}" >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys'
    stdin, stdout, stderr = client.exec_command(command)
    stdout.channel.recv_exit_status()

    # Проверяем что ключ добавлен
    stdin, stdout, stderr = client.exec_command('cat ~/.ssh/authorized_keys | tail -1')
    result = stdout.read().decode().strip()

    if public_key in result:
        print("✓ SSH ключ успешно добавлен!")
        print("Теперь можно запустить деплой:")
        print("cd /c/USE/deploy && ./full-deploy.sh 138.124.26.50 usecommunity.online")
        sys.exit(0)
    else:
        print("✗ Ошибка добавления ключа")
        sys.exit(1)

    client.close()

except Exception as e:
    print(f"✗ Ошибка: {e}")
    sys.exit(1)
