$(document).ready(function () {
    const $modal = $('.modal');

    // Check if modal exists before proceeding
    if ($modal.length === 0) {
        return
    }

    const $closeBtn = $('.modal .close');
    // Close modal on close button click
    $closeBtn.click(function () {
        $modal.hide();
    });

    // Hide modal when clicking outside of it
    $(window).click(function (event) {
        if ($(event.target).hasClass('modal')) {
            $modal.hide();
        }
    });
});
