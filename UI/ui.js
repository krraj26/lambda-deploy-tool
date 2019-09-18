$(document).ready(function () {

    
    $.ajax({
        type: "GET",
        url: 'http://localhost:8383/directories',
        contentType: "application/json",
        cache: false,
        success: function (data) {
            //("#span").css('color', 'green');
            $("#span").html(data);
            $.each(data, function (index, value) {
                $('#selectOne').append('<option value=' + value.filePath + '>' + value.fileName + '</option>');
            });
        },
        error: function (err) {
            $("#span").addClass('danger');
            $("#span").html("Something is wrong, Please check " + JSON.stringify(err));
        }
    });

    $("#selectOne").on('change', function()
    {
       $('#selectedDir').val($('#selectOne option:selected').text()); 
       $('#deploy').prop("disabled", false);
       $("#span").css("display","none");
    })
    
    $('#deploy').on('click', function () {

        $("#span").css("display","none");
        var dirName = $('#selectedDir').val();
        $.ajax({
            type: "POST",
            url: 'http://localhost:8383/deploy/' + dirName,
            contentType: "application/json",
            cache: false,
            success: function (data) {   
                getStatus = data;            
               
                interval = setInterval(function () {
                    checkStatus();
                }, 10000);
            },
            error: function (err) {

                $("#span").addClass('danger');
                $("#span").html("Something is wrong, Please check " + JSON.stringify(err));

            }
        });

    });

    function checkStatus() {
        var pipelineStatus;
        pipelineStatus = getStatus;


        var source = pipelineStatus.stageStates[0].latestExecution.status;
        var build = pipelineStatus.stageStates[1].latestExecution.status;
        var deploy = pipelineStatus.stageStates[2].latestExecution.status;
        var sourceId = pipelineStatus.stageStates[0].latestExecution.pipelineExecutionId;
        var buildId = pipelineStatus.stageStates[1].latestExecution.pipelineExecutionId;
        var depolyId = pipelineStatus.stageStates[2].latestExecution.pipelineExecutionId;

        if (sourceId == buildId ) {
            if (source == "Failed" || build == "Failed" || (deploy == "Failed" && sourceId == deployId)) {
                clearInterval(interval);
            } else if (sourceId == buildId && deployId == buildId && 
                source == "Succeeded" && build == "Succeeded" && deploy == "Succeeded") {
                clearInterval(interval);
            }
        }

        $.ajax({
            type: "GET",
            url: 'http://localhost:8383/status',
            contentType: "application/json",
            cache: false,
            success: function (data) {
                
                getStatus = data;
                //$("#progress_bar").css("display", "block");

                source = data.stageStates[0].latestExecution.status;
                sourceId = data.stageStates[0].latestExecution.pipelineExecutionId;
                build = data.stageStates[1].latestExecution.status;
                buildId = data.stageStates[1].latestExecution.pipelineExecutionId;
                deploy = data.stageStates[2].latestExecution.status;
                deployId = data.stageStates[2].latestExecution.pipelineExecutionId;
                    

                let percentageSource = 0, percentageBuild = 0, percentageDeploy = 0;
                let totalProgress = (percentageSource + percentageBuild + percentageDeploy);

                    
                    if (source == 'InProgress')
                        $('#source').find('label').css('background', 'yellow');
                    if (source == 'Succeeded'){
                        percentageSource = 100 / 3;
                        totalProgress = (percentageSource + percentageBuild + percentageDeploy);
                    }
                    if (source == 'Failed'){
                        percentageSource = 100 / 3;
                        totalProgress = (percentageSource + percentageBuild + percentageDeploy);
                        $("#span").html('Source Failed');
                        $('#span').addClass('danger');
                        $('#progress_bar').removeClass('bg-success');
                        $('#progress_bar').addClass('bg-danger');
                        $("#span").css("display","block");
                    }
    
                    
                    
                    if (build == 'InProgress')
                        $('#build').find('label').css('background', 'yellow');
                    if (build == 'Succeeded' && sourceId == buildId){
                        percentageBuild = 100 / 3;
                        totalProgress = (percentageSource + percentageBuild + percentageDeploy);
                    }
                    if (sourceId == buildId && build == 'Failed'){
                        percentageBuild = 100 / 3;
                        totalProgress = (percentageSource + percentageBuild + percentageDeploy);
                        $("#span").html('Build Failed');
                        $('#span').addClass('danger');
                        $('#progress_bar').removeClass('bg-success');
                        $('#progress_bar').addClass('bg-danger');
                        $("#span").css("display","block");
                    }
    

                    if (deploy == 'InProgress')
                        $('#deploy').find('label').css('background', 'yellow');
                    if (deploy == 'Succeeded' && sourceId == buildId && buildId == depolyId) {
                        percentageDeploy = 100 / 3;
                        totalProgress = (percentageSource + percentageBuild + percentageDeploy);
                    }
                    if (sourceId == buildId && deployId == buildId && deploy == 'Failed'){
                        percentageDeploy = 100 / 3;
                        totalProgress = (percentageSource + percentageBuild + percentageDeploy);    
                        $('#progress_bar').removeClass('bg-success');
                        $('#progress_bar').addClass('bg-danger');
                        $("#span").html('Deploy Failed');
                        $('#span').addClass('danger');
                        $("#span").css("display","block");
                    }
                                      
                    $('#progress_bar').css('width', totalProgress+'%');
                    if(deploy != 'Failed' && totalProgress > 90 ){
                        $("#span").html('Lambda Deployeed successfully');
                        $("#span").addClass('green');
                        $("#span").css("display","block");
                    }
            },
            error: function (err) {
                 $('#span').addClass('danger');
                $("#span").html("Something is wrong, Please check ");

            },
            
        });
    }


    $("#sync").on('click', function () {
        $("#span").css("display","block");
        $.ajax({
            type: "GET",
            url: 'http://localhost:8383/pullfiles',
            contentType: "application/json",
            cache: false,
            success: function (data) {
                $("#span").css('color', 'green');
                $("#span").html(data);
                $("#span").addClass('green');
            },
            error: function (err) {
                 $('#span').addClass('danger');
                $("#span").html("Something is wrong, Please check ");

            }
        });
    });

});
