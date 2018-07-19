/**
 * Created by yasin on 17.01.2018.
 */

function confirmMe(type, title, text) {

    swal({
        title: title,
        text: text,
        icon: type,
        buttons: ["Vazgeç", "Tamam"],
        dangerMode: true

    }).then(function (response) {

        if (response) {
            swal("İşleminiz başarıyle gerçekleşti.", {
                icon: "success"
            });
        }
    });
}

