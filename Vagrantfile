# -*- mode: ruby -*-
# vi: set ft=ruby :

Vagrant.configure(2) do |config|

  config.vm.box = "hashicorp/precise64"
    #proxy
  if Vagrant.has_plugin?("vagrant-proxyconf")
    config.proxy.http = "http://10.11.89.53:3128" #Note this is Dom's local machine proxy
    config.proxy.https = "http://10.11.89.53:3128" #Note this is Dom's local machine proxy
    config.proxy.no_proxy = "localhost,127.0.0.1"
  end
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
   SHELL
end
