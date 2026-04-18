if( NOT WIN32 )
	return()
endif()

message( STATUS "Creating target rostars_bg_overlay (Windows BG HUD)" )
add_executable( rostars_bg_overlay WIN32
	main.cpp
)
target_compile_definitions( rostars_bg_overlay PRIVATE UNICODE _UNICODE )
target_link_libraries( rostars_bg_overlay PRIVATE winhttp )
set_target_properties( rostars_bg_overlay PROPERTIES WIN32_EXECUTABLE TRUE )
message( STATUS "Creating target rostars_bg_overlay - done" )
