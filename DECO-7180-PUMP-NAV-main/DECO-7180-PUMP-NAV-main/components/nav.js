$(document).ready(function () {
    // Toggle navbar list on hamburger icon click
    $('.hamburger').click(function () {
        $('.navbar-list').toggleClass('active');
    });

    // Handle window resizing to ensure navbar is reset on large screens
    function handleResize() {
        if ($(window).width() >= 768) {
            $('.navbar-list').removeClass('active');
        }
    }

    // Initial call to set navbar state based on current window size
    handleResize();

    // Adjust navbar on window resize
    $(window).resize(function () {
        handleResize();
    });
});
