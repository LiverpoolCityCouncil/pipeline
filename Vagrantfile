# -*- mode: ruby -*-
# vi: set ft=ruby :

Vagrant.configure(2) do |config|

  config.vm.box = "hashicorp/precise64"
  config.vm.network "forwarded_port", guest: 80, host: 8080
  config.vm.network "forwarded_port", guest: 8080, host: 8081
  config.vm.synced_folder "app/", "/pipeline"
   config.vm.provision "shell", inline: <<-SHELL
     sudo apt-get update
     sudo apt-get install -y curl
     curl -sL https://deb.nodesource.com/setup_4.x | sudo -E bash -
     sudo apt-get install -y nodejs
     sudo apt-get install -y git
     cd /pipeline
     npm install
     bower install
   SHELL
end
