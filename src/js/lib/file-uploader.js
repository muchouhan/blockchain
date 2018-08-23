/**
 * Upload the photos using ajax request.
 *
 * @param formData
 */
function uploadFiles(event) {
	console.log("Submit file upload"+ event.target.files);
	
	// Get form
    var form = $('#frmUploader')[0];

	// Create an FormData object 
    var formData = new FormData(form);
    formData.append('photos[]', event.target.files[0], event.target.files[0].name);
	
    $.ajax({
        url: 'http://localhost:5000/upload_photos',
        method: 'post',
        data: formData,
        processData: false,
        contentType: false,
        xhr: function () {
            var xhr = new XMLHttpRequest();
            return xhr;
        }
    }).done(function(data){
    	if (data.length > 0) {
            var img = data[0];
            console.log(img);
            if (img.status) {
            	$('#userDocId').val(img.filename);
            	$('#userDocExt').val(img.type);
            }
        } else {
            alert('No images were uploaded.')
        }	
    }).fail(function (xhr, status) {
        alert(status);
    });
}