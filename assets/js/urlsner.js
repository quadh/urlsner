$(function() {
	$('#collapseOne').on('click', '.btn-auth', function() {
		var user_id = $('input[name="auth-user-id"]').val();
		var auth_key = $('input[name="auth-key"]').val();
		
		if (user_id && auth_key) {
			$.post(base_url + '/auth', {'user-id': user_id, 'auth-key': auth_key}, function(json_resp) {		
				if (json_resp.error === false) {
					$('#createModal h5.modal-title').html(json_resp.message);
					$('#createModal .modal-body').html(base_url + '/' + json_resp.token);
					
					$('#createModal').on('hidden.bs.modal', function() {
						$('#createModal h5.modal-title').html('');
						$('#createModal .modal-body').html('');
						window.location.reload();
					});
				} else {
					$('#createModal h5.modal-title').html('There seems to be a problem...');
					$('#createModal .modal-body').html(json_resp.message);
				}
				
				$('#createModal').modal({
				  keyboard: true
				});
			});
		}
		
	});
	
	$('#collapseTwo').on('click', '.btn-create', function() {
		var actual_url = $('input[name="actual_url"]').val();
		
		if (actual_url.length > 0) {
			$.post(base_url + '/create', {'actual_url': actual_url}, function(json_resp) {		
				if (json_resp.error === false) {					
					$('#createModal h5.modal-title').html(json_resp.message);
					$('#createModal .modal-body').html(base_url + '/' + json_resp.url.hash);
				} else {
					$('#createModal h5.modal-title').html('There seems to be a problem...');
					$('#createModal .modal-body').html(json_resp.message);
				}
				
				$('input[name="actual_url"]').val('');
				$('#createModal').modal({
				  keyboard: true
				});
			});
		}		
	});
	
	$('#collapseThree').on('click', '.btn-list-all', function() {
		$.get(base_url + '/get-all', function(json_resp) {
			$('div.return-msg').removeClass('alert alert-info');
			$('div.return-msg').html('');
			
			if (json_resp.error === false) {
				 if (!$.fn.DataTable.isDataTable('#all-data')) {
					$('#all-data').DataTable({
						data: json_resp.return_data,
						columns: [
							{ title: "Hash" },
							{ title: "URL" },
							{ title: "Status" },
							{ title: "Created",
							  orderData: [5]},
							{ visible: false,
						      searchable: false},
							{ title: "Updated",
							  orderData: [7]},
							{ visible: false,
						      searchable: false},
							{ title: ' '}
						]
					});
				} else {
					$('#all-data').DataTable().clear().draw();
					$('#all-data').DataTable().rows.add(json_resp.return_data).draw();
				}
			} else {
				$('#createModal h5.modal-title').html('There seems to be a problem...');
				$('#createModal .modal-body').html(json_resp.message);
				$('#createModal').modal({
				  keyboard: true
				});
			}
			
			
		});
	});
	
	$('#all-data').on('click', '.btn-delete', function() {
		var hidden_hash = $(this).closest('td').find('input').val();
		$('#deleteModal h5.modal-title').html('Deleting...');
		$('#deleteModal .modal-body').html('Are you sure?<input type="hidden" name="hash" value="' + hidden_hash + '"/>');
		$('#deleteModal').modal({
		  keyboard: true
		});
	});
	
	$('#deleteModal').on('click', '.btn-confirm-delete', function() {
		var hash = $('#deleteModal .modal-body').find('input[name="hash"]').val();
		
		$.post(base_url + '/delete', {'hash': hash}, function(json_resp) {
			$('#deleteModal').modal('hide');
			
			$('div.return-msg').html(json_resp.message);
			$('div.return-msg').addClass('alert alert-info');
		});
	});
	
	$('#createModal').on('hidden.bs.modal', function() {
		$('#createModal h5.modal-title').html('');
		$('#createModal .modal-body').html('');
	});
	
	$('#deleteModal').on('hidden.bs.modal', function() {
		$('#deleteModal h5.modal-title').html('');
		$('#deleteModal .modal-body').html('');
	});
});