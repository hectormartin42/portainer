angular.module('portainer.services')
.factory('TemplateService', ['$q', 'Template', 'TemplateHelper', 'ImageHelper', function TemplateServiceFactory($q, Template, TemplateHelper, ImageHelper) {
  'use strict';
  var service = {};

  service.getTemplates = function() {
    var deferred = $q.defer();
    Template.get().$promise
    .then(function success(data) {
      var templates = data.map(function (tpl, idx) {
        var template = new TemplateViewModel(tpl);
        template.index = idx;
        return template;
      });
      deferred.resolve(templates);
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to retrieve templates', err: err });
    });
    return deferred.promise;
  };

  service.createTemplateConfiguration = function(template, containerName, network, containerMapping) {
    var imageConfiguration = service.createImageConfiguration(template);
    var containerConfiguration = service.createContainerConfiguration(template, containerName, network, containerMapping);
    containerConfiguration.Image = imageConfiguration.fromImage + ':' + imageConfiguration.tag;
    return {
      container: containerConfiguration,
      image: imageConfiguration
    };
  };

  service.createImageConfiguration = function(template) {
    return ImageHelper.createImageConfigForContainer(template.Image, template.Registry);
  };

  service.createContainerConfiguration = function(template, containerName, network, containerMapping) {
    var configuration = TemplateHelper.getDefaultContainerConfiguration();
    configuration.HostConfig.NetworkMode = network.Name;
    configuration.name = containerName;
    configuration.Image = template.Image;
    if (template.Env) {
      configuration.Env = TemplateHelper.EnvToStringArray(template.Env, containerMapping);
    }
    var portConfiguration = TemplateHelper.portArrayToPortConfiguration(template.Ports);
    configuration.HostConfig.PortBindings = portConfiguration.bindings;
    configuration.ExposedPorts = portConfiguration.exposedPorts;
    return configuration;
  };

  service.updateContainerConfigurationWithVolumes = function(configuration, template, createdVolumes) {
    createdVolumes.forEach(function (volume, idx) {
      configuration.Volumes[template.Volumes[idx]] = {};
      configuration.HostConfig.Binds.push(volume.Name + ':' + template.Volumes[idx]);
    });
  };

  return service;
}]);
