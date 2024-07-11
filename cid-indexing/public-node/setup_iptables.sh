#!/bin/bash

# Limit new TCP connections per minute per IP
iptables -A INPUT -p tcp --dport 4001 -m state --state NEW -m recent --set
iptables -A INPUT -p tcp --dport 4001 -m state --state NEW -m recent --update --seconds 60 --hitcount 30 -j DROP

# Limit bandwidth for IPFS connections
iptables -A OUTPUT -p tcp --sport 4001 -m hashlimit --hashlimit-above 2mb/s --hashlimit-burst 10mb --hashlimit-mode srcip --hashlimit-name ipfs-limit -j DROP

# Implement UDP flood protection
iptables -A INPUT -p udp -m state --state NEW -m recent --set
iptables -A INPUT -p udp -m state --state NEW -m recent --update --seconds 1 --hitcount 10 -j DROP

# Set conntrack timeout
conntrack -U --timeout 300
