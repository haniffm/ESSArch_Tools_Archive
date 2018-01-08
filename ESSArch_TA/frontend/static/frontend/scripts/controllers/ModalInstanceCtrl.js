/*
    ESSArch is an open source archiving and digital preservation system

    ESSArch Tools for Archive (ETA)
    Copyright (C) 2005-2017 ES Solutions AB

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program. If not, see <http://www.gnu.org/licenses/>.

    Contact information:
    Web - http://www.essolutions.se
    Email - essarch@essolutions.se
*/

angular.module('myApp').controller('ModalInstanceCtrl', function ($uibModalInstance, djangoAuth, $scope, $http, appConfig, $translate) {
    var $ctrl = this;
    $ctrl.error_messages_old = [];
    $ctrl.error_messages_pw1 = [];
    $ctrl.error_messages_pw2 = [];
    $ctrl.workareaRemove = true;
    $ctrl.receptionRemove = true;
    $ctrl.tracebackCopied = false;
    $ctrl.copied = function() {
        $ctrl.tracebackCopied = true;
    }
    $ctrl.idCopied = false;
    $ctrl.idCopyDone = function() {
        $ctrl.idCopied = true;
    }
    $ctrl.save = function () {
        $ctrl.data = {
            name: $ctrl.profileName
        };
        $uibModalInstance.close($ctrl.data);
    };
    $ctrl.prepare = function () {
        $ctrl.data = {
            label: $ctrl.label
        };
        $uibModalInstance.close($ctrl.data);
    };
    $ctrl.receive = function () {
        $ctrl.data = {
            ip: $scope.displayedIps,
            sa: $ctrl.sa,
        };
        $uibModalInstance.close($ctrl.data);
    }
    $ctrl.transfer = function () {
        $ctrl.data = {
            ip: $scope.ip
        };
        $uibModalInstance.close($ctrl.data);
    }
    $ctrl.lock = function () {
        $ctrl.data = {
            status: "locked"
        }
        $uibModalInstance.close($ctrl.data);
    };
    $ctrl.lockSa = function() {
        $ctrl.data = {
            status: "locked"
        }
        $uibModalInstance.close($ctrl.data);
    };
    $ctrl.remove = function () {
        $ctrl.data = {
            workarea: $ctrl.workareaRemove,
            reception: $ctrl.receptionRemove
        }
        $uibModalInstance.close($ctrl.data);
    };
    $ctrl.prepareUnidentified = function () {
        $ctrl.data = {
            status: "prepared"
        }
        $uibModalInstance.close($ctrl.data);
    };
    $ctrl.changePassword = function () {
        djangoAuth.changePassword($ctrl.pw1, $ctrl.pw2, $ctrl.oldPw).then(function(response) {
            $uibModalInstance.close($ctrl.data);
        }, function(error) {
            $ctrl.error_messages_old = error.old_password || [];
            $ctrl.error_messages_pw1 = error.new_password1 || [];
            $ctrl.error_messages_pw2 = error.new_password2 || [];
        });
    };
    $ctrl.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
})
.controller('OverwriteModalInstanceCtrl', function ($uibModalInstance, djangoAuth, data, SA, Profile, TopAlert) {
    var $ctrl = this;
    if(data.file) {
        $ctrl.file = data.file;
    }
    if(data.type) {
        $ctrl.type = data.type;
    }
    if(data.profile) {
        $ctrl.profile = data.profile;
    }
    $ctrl.overwriteProfile = function() {
        return Profile.update($ctrl.profile).$promise.then(function(resource) {
            TopAlert.add("Profile: \"" + resource.name + "\" has been imported" , "success", 5000);
            $ctrl.data = {
                status: "overwritten"
            }
            $uibModalInstance.close($ctrl.data);
            return resource;
        }).catch(function(repsonse) {
            TopAlert.add(response.detail, "error");
        })
    }
    $ctrl.overwriteSa = function() {
        $ctrl.profile.published = false;
        return SA.update($ctrl.profile).$promise.then(function(resource) {
            TopAlert.add("Submission agreement: \"" + resource.name + "\" has been imported" , "success", 5000);
            $ctrl.data = {
                status: "overwritten"
            }
            $uibModalInstance.close($ctrl.data);
            return resource;
        }).catch(function(response) {
            TopAlert.add("Submission Agreement " + $ctrl.profile.name + " is Published and can not be overwritten", "error");
        })
    }
    $ctrl.overwrite = function () {
        $ctrl.data = {
            status: "overwritten"
        }
        $uibModalInstance.close($ctrl.data);
    };
    $ctrl.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
})
.controller('DataModalInstanceCtrl', function ($uibModalInstance, djangoAuth, data, $http, appConfig, TopAlert, $uibModal, $log) {
    var $ctrl = this;
    $ctrl.data = data;
    $ctrl.file = data.file;
    $ctrl.type = data.type;
    $ctrl.showFullscreenMessage = function() {
        var modalInstance = $uibModal.open({
            animation: true,
            ariaLabelledBy: 'modal-title',
            ariaDescribedBy: 'modal-body',
            templateUrl: 'static/frontend/views/validation_fullscreen_message.html',
            controller: 'DataModalInstanceCtrl',
            controllerAs: '$ctrl',
            windowClass: 'fullscreen-modal',
            resolve: {
                data: {
                    validation: $ctrl.data.validation
                }
            }
        })
        modalInstance.result.then(function (data) {
        }, function () {
            $log.info('modal-component dismissed at: ' + new Date());
        });
    }
    $ctrl.ok = function () {
        $uibModalInstance.close();
    };
    $ctrl.transform = function() {
        $http.post(appConfig.djangoUrl + "workarea-entries/" + $ctrl.data.ip.workarea.id+"/transform/").then(function(response) {
            TopAlert.add(response.data, "success");
            $uibModalInstance.close(response.data);
        }).catch(function(response) {
            TopAlert.add(response.data.detail, "error");
        })
    }
    $ctrl.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
})
.controller('ReceiveModalInstanceCtrl', function ($uibModalInstance, djangoAuth, data, $scope, IPReception, $translate) {
    var $ctrl = this;
    $ctrl.$onInit = function() {
        $ctrl.data = data;
        $ctrl.file = data.file;
        $ctrl.type = data.type;
        if($ctrl.data.sa) {
            $ctrl.data.submissionAgreements.forEach(function(sa) {
                if(sa.id == $ctrl.data.sa) {
                    $ctrl.sa = sa;
                    $ctrl.saDisabled = true;
                }
            });
        } else {
            if($ctrl.data.submissionAgreements.length > 0) {
                $ctrl.sa = $ctrl.data.submissionAgreements[0];
            } else {
                $ctrl.sa = null;
                $ctrl.receiveSaError = $translate.instant('NO_SUBMISSION_AGREEMENT_AVAILABLE');
            }
        }

        if(angular.isUndefined($ctrl.sa)) {
            $ctrl.receiveSaError = $translate.instant('CANNOT_RECEIVE_ERROR');
            $ctrl.saDisabled = true;
        }
    }
    $ctrl.receive = function () {
        var payload = {
            id: $ctrl.data.ip,
        }
        if($ctrl.sa && $ctrl.sa != null) {
            payload.submission_agreement = $ctrl.sa.id;
        }
        IPReception.receive(payload).$promise.then(function(response) {
            $ctrl.data = {
                status: "receive",
                ip: $ctrl.data.ip,
                sa: $ctrl.sa,
            };
            $uibModalInstance.close($ctrl.data);
        }, function(response) {
            $scope.receiveDisabled = false;
        });
    }
    $ctrl.skip = function () {
        $ctrl.data = {
            status: "skip"
        };
        $uibModalInstance.close($ctrl.data);
    }
    $ctrl.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
});
