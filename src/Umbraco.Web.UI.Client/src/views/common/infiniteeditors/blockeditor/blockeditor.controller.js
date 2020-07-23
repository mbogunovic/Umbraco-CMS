angular.module("umbraco")
.controller("Umbraco.Editors.BlockEditorController",
    function ($scope, localizationService, formHelper) {
        var vm = this;

        vm.model = $scope.model;
        vm.model = $scope.model;
        vm.tabs = [];
        localizationService.localizeMany([
            vm.model.liveEditing ? "prompt_discardChanges" : "general_close",
            vm.model.liveEditing ? "buttons_confirmActionConfirm" : "buttons_submitChanges"
        ]).then(function (data) {
            vm.closeLabel = data[0];
            vm.submitLabel = data[1];
        });

        if ($scope.model.content && $scope.model.content.variants) {

            var apps = $scope.model.content.apps;

            vm.tabs = apps;

            // replace view of content app.
            var contentApp = apps.find(entry => entry.alias === "umbContent");
            if (contentApp) {
                contentApp.view = "views/common/infiniteeditors/blockeditor/blockeditor.content.html";
                if(vm.model.hideContent) {
                    apps.splice(apps.indexOf(contentApp), 1);
                } else if (vm.model.openSettings !== true) {
                    contentApp.active = true;
                }
            }

            // remove info app:
            var infoAppIndex = apps.findIndex(entry => entry.alias === "umbInfo");
            apps.splice(infoAppIndex, 1);

        }

        if (vm.model.settings && vm.model.settings.variants) {
            localizationService.localize("blockEditor_tabBlockSettings").then(
                function (settingsName) {
                    var settingsTab = {
                        "name": settingsName,
                        "alias": "settings",
                        "icon": "icon-settings",
                        "view": "views/common/infiniteeditors/blockeditor/blockeditor.settings.html"
                    };
                    vm.tabs.push(settingsTab);
                    if (vm.model.openSettings) {
                        settingsTab.active = true;
                    }
                }
            );
        }

        vm.submitAndClose = function () {
            if (vm.model && vm.model.submit) {
                // always keep server validations since this will be a nested editor and server validations are global
                if (formHelper.submitForm({ scope: $scope, formCtrl: vm.blockForm, keepServerValidation: true })) {
                    vm.model.submit(vm.model);
                }
            }
        }

        vm.close = function () {
            if (vm.model && vm.model.close) {
                // TODO: At this stage there could very well have been server errors that have been cleared 
                // but if we 'close' we are basically cancelling the value changes which means we'd want to cancel
                // all of the server errors just cleared. It would be possible to do that but also quite annoying.
                // The rudimentary way would be to:
                // * Track all cleared server errors here by subscribing to the prefix validation of controls contained here
                // * If this is closed, re-add all of those server validation errors
                // A more robust way to do this would be to:
                // * Add functionality to the serverValidationManager whereby we can remove validation errors and it will
                //      maintain a copy of the original errors
                // * It would have a 'commit' method to commit the removed errors - which we would call in the formHelper.submitForm when it's successful
                // * It would have a 'rollback' method to reset the removed errors - which we would call here

                // TODO: check if content/settings has changed and ask user if they are sure.
                vm.model.close(vm.model);
            }
        }

    }
);